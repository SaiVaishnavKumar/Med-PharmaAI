import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { authenticate } from '../../middleware/auth.js';
import { allocateFEFO } from '../inventory/fefo.js';
import { invoicesRouter } from './invoices.js';

export const salesRouter = Router();
salesRouter.use('/invoices',invoicesRouter);
const saleSchema = z.object({ items: z.array(z.object({ medicineId: z.string().min(1), quantity: z.number().int().positive() })).min(1), paymentMethod: z.enum(['CASH','CARD','UPI','OTHER']), customerId: z.string().optional(), discount: z.number().min(0).default(0) }).refine((sale)=>new Set(sale.items.map((item)=>item.medicineId)).size===sale.items.length,'Use one line per medicine');
salesRouter.get('/', authenticate, async (req,res,next)=>{
  try{const page=Math.max(1,Number(req.query.page)||1),pageSize=Math.min(100,Math.max(1,Number(req.query.pageSize)||20));const search=String(req.query.search??'').trim();const where=search?{invoiceNumber:{contains:search,mode:'insensitive' as const}}:{};const [data,total]=await Promise.all([prisma.sale.findMany({where,skip:(page-1)*pageSize,take:pageSize,orderBy:{createdAt:'desc'},include:{customer:true,cashier:{select:{name:true}},invoice:true}}),prisma.sale.count({where})]);res.json({data,meta:{page,pageSize,total}});}catch(error){next(error);}
});
salesRouter.post('/', authenticate, async (req, res, next) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Sale details are invalid', details: parsed.error.flatten() } });
  if (parsed.data.discount > 0 && !req.user?.roles.some((role) => ['SUPER_ADMIN','PHARMACY_MANAGER'].includes(role))) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Discounts require manager approval' } });
  try {
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const prior = await tx.sale.findUnique({ where: { idempotencyKey }, include: { items: true } });
        if (prior) return prior;
      }
      const items = [] as { medicineId: string; quantity: number; unitPrice: Prisma.Decimal; unitCost: Prisma.Decimal; lineTotal: Prisma.Decimal; allocations: { batchId: string; quantity: number; unitCost: Prisma.Decimal }[] }[];
      let subtotal = new Prisma.Decimal(0);
      for (const input of parsed.data.items) {
        const medicine = await tx.medicine.findUnique({ where: { id: input.medicineId }, include: { batches: { where: { availableQuantity: { gt: 0 }, expiryDate: { gt: new Date() } }, orderBy: { expiryDate: 'asc' } } } });
        if (!medicine?.isActive) throw Object.assign(new Error('Medicine is unavailable'), { status: 404 });
        const allocations = allocateFEFO(medicine.batches, input.quantity).map((allocation) => ({ ...allocation, unitCost: medicine.batches.find((batch) => batch.id === allocation.batchId)!.purchasePrice }));
        const lineTotal = allocations.reduce((sum, allocation) => sum.add(medicine.batches.find((batch) => batch.id === allocation.batchId)!.sellingPrice.mul(allocation.quantity)), new Prisma.Decimal(0));
        const price = lineTotal.div(input.quantity).toDecimalPlaces(2);
        const cost = allocations.reduce((sum, allocation) => sum.add(allocation.unitCost.mul(allocation.quantity)), new Prisma.Decimal(0)).div(input.quantity).toDecimalPlaces(2);
        for (const allocation of allocations) {
          const changed = await tx.medicineBatch.updateMany({ where: { id: allocation.batchId, availableQuantity: { gte: allocation.quantity }, expiryDate: { gt: new Date() } }, data: { availableQuantity: { decrement: allocation.quantity } } });
          if (changed.count !== 1) throw Object.assign(new Error('Stock changed during checkout. Please retry.'), { status: 409 });
          await tx.stockMovement.create({ data: { medicineId: medicine.id, batchId: allocation.batchId, type: 'SALE', quantity: -allocation.quantity, referenceType: 'SALE', reason: 'Point of sale', performedBy: req.user!.id } });
        }
        subtotal = subtotal.add(lineTotal);
        items.push({ medicineId: medicine.id, quantity: input.quantity, unitPrice: price, unitCost: cost, lineTotal, allocations });
      }
      if (parsed.data.discount > subtotal.toNumber()) throw Object.assign(new Error('Discount cannot exceed subtotal'), { status: 400 });
      const taxRate = await tx.taxConfiguration.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
      const taxable = subtotal.sub(parsed.data.discount);
      const tax = taxable.mul(taxRate?.rate ?? 0).div(100).toDecimalPlaces(2);
      const invoiceNumber = `MF-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const sale = await tx.sale.create({ data: { invoiceNumber, idempotencyKey, customerId: parsed.data.customerId, cashierId: req.user!.id, subtotal, discount: parsed.data.discount, taxAmount: tax, totalAmount: taxable.add(tax), paymentMethod: parsed.data.paymentMethod, items: { create: items.map(({ allocations: _allocations, ...item }) => ({ ...item, taxAmount: new Prisma.Decimal(0), discount: new Prisma.Decimal(0) })) } } });
      await tx.invoice.create({ data: { saleId: sale.id, invoiceNumber } });
      await tx.payment.create({ data: { saleId:sale.id, amount:sale.totalAmount, method:parsed.data.paymentMethod } });
      for (const item of items) for (const allocation of item.allocations) await tx.saleAllocation.create({ data: { saleId: sale.id, batchId: allocation.batchId, quantity: allocation.quantity, unitCost: allocation.unitCost } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'SALE_CREATED', entityType: 'Sale', entityId: sale.id, newValue: { invoiceNumber, total: sale.totalAmount.toString() } } });
      return tx.sale.findUniqueOrThrow({ where: { id: sale.id }, include: { items: true, allocations: { include: { batch: true } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json({ data: result });
  } catch (error) {
    const key = req.header('Idempotency-Key');
    if (key && typeof error === 'object' && error !== null && 'code' in error && ['P2002','P2034'].includes(String((error as {code:string}).code))) {
      try { const prior = await prisma.sale.findUnique({where:{idempotencyKey:key},include:{items:true,allocations:{include:{batch:true}}}}); if(prior)return res.status(200).json({data:prior}); } catch { /* continue with the original error */ }
    }
    next(error);
  }
});
