import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { authenticate, allowRoles } from '../../middleware/auth.js';

export const inventoryRouter = Router();
inventoryRouter.get('/batches',authenticate,async(_req,res,next)=>{try{const batches=await prisma.medicineBatch.findMany({orderBy:{expiryDate:'asc'},take:500,include:{medicine:{select:{id:true,name:true,sku:true,reorderLevel:true}},supplier:{select:{name:true}}}});res.json({data:batches});}catch(error){next(error);}});
inventoryRouter.get('/movements',authenticate,async(req,res,next)=>{try{const page=Math.max(1,Number(req.query.page)||1),pageSize=Math.min(100,Math.max(1,Number(req.query.pageSize)||30));const [data,total]=await Promise.all([prisma.stockMovement.findMany({skip:(page-1)*pageSize,take:pageSize,orderBy:{createdAt:'desc'},include:{medicine:{select:{name:true,sku:true}},batch:{select:{batchNumber:true}},user:{select:{name:true}}}}),prisma.stockMovement.count()]);res.json({data,meta:{page,pageSize,total}});}catch(error){next(error);}});
const adjustmentInput = z.object({
  batchId: z.string().min(1),
  delta: z.number().int().refine((n) => n !== 0),
  reason: z.string().trim().min(3).max(500),
});

inventoryRouter.post('/adjustments', authenticate, allowRoles('SUPER_ADMIN', 'PHARMACY_MANAGER', 'INVENTORY_MANAGER'), async (req, res, next) => {
  const parsed = adjustmentInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A batch, non-zero whole quantity and reason are required', details: parsed.error.flatten() } });
  if (Math.abs(parsed.data.delta) > 5 && !req.user?.roles.some((role) => ['SUPER_ADMIN', 'PHARMACY_MANAGER'].includes(role))) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Adjustments larger than five units require manager approval' } });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.medicineBatch.findUnique({ where: { id: parsed.data.batchId } });
      if (!batch) return null;
      const after = batch.availableQuantity + parsed.data.delta;
      if (after < 0) throw Object.assign(new Error('Adjustment would create negative stock'), { status: 409 });
      const updated = await tx.medicineBatch.updateMany({ where: { id: batch.id, availableQuantity: batch.availableQuantity }, data: { availableQuantity: after } });
      if (updated.count !== 1) throw Object.assign(new Error('Stock changed; retry the adjustment'), { status: 409 });
      const record = await tx.stockAdjustment.create({ data: { reason: parsed.data.reason, createdBy: req.user!.id, approvedBy: req.user!.id, items: { create: { medicineId: batch.medicineId, batchId: batch.id, beforeQuantity: batch.availableQuantity, afterQuantity: after, delta: parsed.data.delta } } } });
      await tx.stockMovement.create({ data: { medicineId: batch.medicineId, batchId: batch.id, type: 'ADJUSTMENT', quantity: parsed.data.delta, referenceType: 'ADJUSTMENT', referenceId: record.id, reason: parsed.data.reason, performedBy: req.user!.id } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'STOCK_ADJUSTED', entityType: 'MedicineBatch', entityId: batch.id, oldValue: { availableQuantity: batch.availableQuantity }, newValue: { availableQuantity: after }, reason: parsed.data.reason } });
      return record;
    });
    if (!result) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    res.status(201).json({ data: result });
  } catch (error) { next(error); }
});

inventoryRouter.get('/alerts', authenticate, async (_req, res, next) => {
  try {
    const now = new Date(); const settings = await prisma.pharmacySettings.findFirst(); const threshold = new Date(now); threshold.setDate(threshold.getDate() + (settings?.nearExpiryDays ?? 30));
    const [medicines, batches, expiredBatches] = await Promise.all([
      prisma.medicine.findMany({ where: { isActive: true }, include: { batches: { where: { availableQuantity: { gt: 0 }, expiryDate: { gt: now } }, select: { availableQuantity: true } } } }),
      prisma.medicineBatch.findMany({ where: { availableQuantity: { gt: 0 }, expiryDate: { gt: now, lte: threshold } }, include: { medicine: { select: { name: true } } }, orderBy: { expiryDate: 'asc' } }),
      prisma.medicineBatch.findMany({ where: { availableQuantity: { gt: 0 }, expiryDate: { lte: now } }, include: { medicine: { select: { name: true } } }, orderBy: { expiryDate: 'desc' } }),
    ]);
    const low = medicines.filter((m) => m.batches.reduce((sum, b) => sum + b.availableQuantity, 0) <= m.reorderLevel).map((m) => ({ type: 'LOW_STOCK', medicineId: m.id, message: `${m.name} is at or below its reorder level` }));
    const expiry = batches.map((b) => ({ type: 'NEAR_EXPIRY', medicineId: b.medicineId, batchId: b.id, message: `${b.medicine.name} batch ${b.batchNumber} expires ${b.expiryDate.toISOString().slice(0, 10)}` }));
    const expired = expiredBatches.map((b) => ({ type: 'EXPIRED', medicineId: b.medicineId, batchId: b.id, message: `${b.medicine.name} batch ${b.batchNumber} expired ${b.expiryDate.toISOString().slice(0, 10)}` }));
    res.json({ data: [...low, ...expiry, ...expired] });
  } catch (error) { next(error); }
});

const returnInput = z.object({
  items: z.array(z.object({ saleItemId: z.string().min(1), quantity: z.number().int().positive(), restock: z.boolean().default(false), batchId: z.string().min(1) })).min(1)
    .refine((items) => new Set(items.map((item) => `${item.saleItemId}:${item.batchId}`)).size === items.length, 'Duplicate item and batch entries are not allowed'),
  reason: z.string().trim().min(3).max(500),
});

inventoryRouter.post('/returns', authenticate, allowRoles('SUPER_ADMIN', 'PHARMACY_MANAGER', 'PHARMACIST'), async (req, res, next) => {
  const parsed = returnInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Return items, original batch and a reason are required', details: parsed.error.flatten() } });
  try {
    const result = await prisma.$transaction(async (tx) => {
      let refund = new Prisma.Decimal(0); let saleId: string | undefined;
      for (const input of parsed.data.items) {
        const item = await tx.saleItem.findUnique({ where: { id: input.saleItemId } });
        if (!item) throw Object.assign(new Error('Sale item not found'), { status: 404 });
        if (saleId && saleId !== item.saleId) throw Object.assign(new Error('A return can only include items from one sale'), { status: 400 });
        saleId = item.saleId;
        const allocation = await tx.saleAllocation.findFirst({ where: { saleId: item.saleId, batchId: input.batchId, batch: { medicineId: item.medicineId } } });
        if (!allocation) throw Object.assign(new Error('Choose a batch allocated to the original sale'), { status: 400 });
        const [allReturned, batchReturned] = await Promise.all([
          tx.returnItem.aggregate({ where: { saleItemId: item.id }, _sum: { quantity: true } }),
          tx.returnItem.aggregate({ where: { saleItemId: item.id, batchId: input.batchId }, _sum: { quantity: true } }),
        ]);
        const requestedForItem = parsed.data.items.filter((line) => line.saleItemId === item.id).reduce((sum, line) => sum + line.quantity, 0);
        const requestedForBatch = parsed.data.items.filter((line) => line.saleItemId === item.id && line.batchId === input.batchId).reduce((sum, line) => sum + line.quantity, 0);
        if ((allReturned._sum.quantity ?? 0) + requestedForItem > item.quantity || (batchReturned._sum.quantity ?? 0) + requestedForBatch > allocation.quantity) throw Object.assign(new Error('Return quantity exceeds the unreturned quantity sold from this batch'), { status: 409 });
        refund = refund.add(item.unitPrice.mul(input.quantity));
      }
      const lines = parsed.data.items;
      const record = await tx.medicineReturn.create({ data: { saleId: saleId!, reason: parsed.data.reason, refundAmount: refund, createdBy: req.user!.id, items: { create: lines } } });
      for (const line of lines) {
        const item = await tx.saleItem.findUniqueOrThrow({ where: { id: line.saleItemId } });
        await tx.medicineBatch.update({ where: { id: line.batchId }, data: line.restock ? { availableQuantity: { increment: line.quantity } } : { quarantinedQuantity: { increment: line.quantity } } });
        await tx.stockMovement.create({ data: { medicineId: item.medicineId, batchId: line.batchId, type: 'RETURN', quantity: line.quantity, referenceType: 'RETURN', referenceId: record.id, reason: parsed.data.reason, performedBy: req.user!.id } });
      }
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'SALE_RETURNED', entityType: 'MedicineReturn', entityId: record.id, reason: parsed.data.reason, newValue: { refundAmount: refund.toString(), items: lines } } });
      return record;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json({ data: result });
  } catch (error) { next(error); }
});
