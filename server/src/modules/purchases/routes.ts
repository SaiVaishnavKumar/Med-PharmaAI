import { Router } from 'express';
import { Prisma, PurchaseStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { authenticate, allowRoles } from '../../middleware/auth.js';

export const purchasesRouter = Router();
const purchaseInput = z.object({
  supplierId: z.string().min(1),
  items: z.array(z.object({ medicineId: z.string().min(1), batchNumber: z.string().trim().min(1), expiryDate: z.coerce.date(), manufacturingDate: z.coerce.date().optional(), quantity: z.number().int().positive(), purchasePrice: z.number().nonnegative(), sellingPrice: z.number().nonnegative() })).min(1),
}).refine((value) => new Set(value.items.map((i) => i.batchNumber)).size === value.items.length, 'Batch numbers must be unique within a purchase');

purchasesRouter.get('/', authenticate, allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER','AUDITOR'), async (_req,res,next) => {
  try { const purchases = await prisma.purchase.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { supplier: true, items: { include: { medicine: true } } } }); res.json({ data: purchases }); }
  catch (error) { next(error); }
});

purchasesRouter.post('/', authenticate, allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER'), async (req,res,next) => {
  const parsed = purchaseInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Purchase details are invalid', details: parsed.error.flatten() } });
  if (parsed.data.items.some((item) => item.expiryDate <= new Date() || item.manufacturingDate && item.manufacturingDate >= item.expiryDate)) return res.status(400).json({ error: { code: 'INVALID_DATES', message: 'Each batch must have a future expiry date after its manufacturing date' } });
  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({ where: { id: parsed.data.supplierId, isActive: true } });
      if (!supplier) throw Object.assign(new Error('Active supplier not found'), { status: 404 });
      const ids = [...new Set(parsed.data.items.map((item) => item.medicineId))];
      const medicines = await tx.medicine.findMany({ where: { id: { in: ids }, isActive: true } });
      if (medicines.length !== ids.length) throw Object.assign(new Error('One or more medicines are inactive or unavailable'), { status: 400 });
      const subtotal = parsed.data.items.reduce((sum,item) => sum.add(new Prisma.Decimal(item.purchasePrice).mul(item.quantity)), new Prisma.Decimal(0));
      const config = await tx.taxConfiguration.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
      const tax = subtotal.mul(config?.rate ?? 0).div(100).toDecimalPlaces(2);
      const number = `PO-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const created = await tx.purchase.create({ data: { purchaseNumber:number, supplierId:supplier.id, createdBy:req.user!.id, subtotal, taxAmount:tax, totalAmount:subtotal.add(tax), status:'DRAFT', items:{ create:parsed.data.items.map((item)=>({medicineId:item.medicineId,batchNumber:item.batchNumber,expiryDate:item.expiryDate,manufacturingDate:item.manufacturingDate,quantity:item.quantity,unitCost:item.purchasePrice,unitPrice:item.sellingPrice})) } }, include:{items:true} });
      await tx.auditLog.create({ data:{userId:req.user!.id,action:'PURCHASE_CREATED',entityType:'Purchase',entityId:created.id,newValue:{purchaseNumber:number,status:'DRAFT'}} });
      return created;
    });
    res.status(201).json({ data:purchase });
  } catch(error) { next(error); }
});

purchasesRouter.patch('/:id/status', authenticate, allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER'), async (req,res,next) => {
  const statusSchema = z.object({ status:z.enum(['ORDERED','CANCELLED']) });
  const parsed=statusSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Status must be ORDERED or CANCELLED'}});
  try {
    const updated=await prisma.$transaction(async(tx)=>{
      const current=await tx.purchase.findUnique({where:{id:String(req.params.id)}});if(!current)return null;
      const allowed=current.status==='DRAFT'&&['ORDERED','CANCELLED'].includes(parsed.data.status);
      if(!allowed)throw Object.assign(new Error(`Cannot transition purchase from ${current.status} to ${parsed.data.status}`),{status:409});
      const changed=await tx.purchase.updateMany({where:{id:current.id,status:current.status},data:{status:parsed.data.status as PurchaseStatus}});if(changed.count!==1)throw Object.assign(new Error('Purchase status changed; retry'),{status:409});
      await tx.auditLog.create({data:{userId:req.user!.id,action:'PURCHASE_STATUS_CHANGED',entityType:'Purchase',entityId:current.id,oldValue:{status:current.status},newValue:{status:parsed.data.status}}});
      return tx.purchase.findUniqueOrThrow({where:{id:current.id},include:{items:true,supplier:true}});
    });
    if(!updated)return res.status(404).json({error:{code:'NOT_FOUND',message:'Purchase not found'}});res.json({data:updated});
  }catch(error){next(error);}
});

purchasesRouter.post('/:id/receive', authenticate, allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER'), async(req,res,next)=>{
  try {
    const received=await prisma.$transaction(async(tx)=>{
      const purchase=await tx.purchase.findUnique({where:{id:String(req.params.id)},include:{items:true}});if(!purchase)return null;
      if(purchase.status!=='ORDERED')throw Object.assign(new Error(`Only ORDERED purchases can be received (current status: ${purchase.status})`),{status:409});
      const locked=await tx.purchase.updateMany({where:{id:purchase.id,status:'ORDERED'},data:{status:'RECEIVED',receivedAt:new Date()}});if(locked.count!==1)throw Object.assign(new Error('Purchase status changed; retry receiving'),{status:409});
      for(const item of purchase.items){
        const batch=await tx.medicineBatch.create({data:{medicineId:item.medicineId,supplierId:purchase.supplierId,batchNumber:item.batchNumber,expiryDate:item.expiryDate,manufacturingDate:item.manufacturingDate,purchasePrice:item.unitCost,sellingPrice:item.unitPrice,quantityReceived:item.quantity,availableQuantity:item.quantity,purchaseItemId:item.id}});
        await tx.stockMovement.create({data:{medicineId:item.medicineId,batchId:batch.id,type:'PURCHASE',quantity:item.quantity,referenceType:'PURCHASE',referenceId:purchase.id,reason:`Received ${purchase.purchaseNumber}`,performedBy:req.user!.id}});
      }
      await tx.auditLog.create({data:{userId:req.user!.id,action:'PURCHASE_RECEIVED',entityType:'Purchase',entityId:purchase.id,oldValue:{status:'ORDERED'},newValue:{status:'RECEIVED'}}});
      return tx.purchase.findUniqueOrThrow({where:{id:purchase.id},include:{supplier:true,items:{include:{medicine:true,batch:true}}}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(!received)return res.status(404).json({error:{code:'NOT_FOUND',message:'Purchase not found'}});res.json({data:received});
  }catch(error){next(error);}
});
