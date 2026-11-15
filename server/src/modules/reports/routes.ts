import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { authenticate, allowRoles } from '../../middleware/auth.js';

export const reportsRouter=Router();
reportsRouter.get('/overview',authenticate,allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','PHARMACIST','INVENTORY_MANAGER','AUDITOR'),async(req,res,next)=>{
 try{
  const days=Math.min(90,Math.max(7,Number(req.query.days)||7)),now=new Date(),start=new Date(now);start.setDate(start.getDate()-days+1);start.setHours(0,0,0,0);
  const [sales,returns,batches,movements]=await Promise.all([
   prisma.sale.findMany({where:{createdAt:{gte:start}},select:{totalAmount:true,createdAt:true}}),
   prisma.medicineReturn.findMany({where:{createdAt:{gte:start}},select:{refundAmount:true,createdAt:true}}),
   prisma.medicineBatch.findMany({select:{medicineId:true,availableQuantity:true,quarantinedQuantity:true,purchasePrice:true,expiryDate:true}}),
   prisma.stockMovement.groupBy({by:['medicineId'],_sum:{quantity:true}}),
  ]);
  const daily=Array.from({length:days},(_,i)=>{const date=new Date(start);date.setDate(start.getDate()+i);const key=date.toISOString().slice(0,10);const gross=sales.filter(s=>s.createdAt.toISOString().slice(0,10)===key).reduce((sum,s)=>sum.add(s.totalAmount),new Prisma.Decimal(0));const refunds=returns.filter(r=>r.createdAt.toISOString().slice(0,10)===key).reduce((sum,r)=>sum.add(r.refundAmount),new Prisma.Decimal(0));return{date:key,revenue:gross.sub(refunds).toFixed(2),sales:sales.filter(s=>s.createdAt.toISOString().slice(0,10)===key).length};});
  const eligible=batches.filter(b=>b.expiryDate>now);const valuation=eligible.reduce((sum,b)=>sum.add(b.purchasePrice.mul(b.availableQuantity)),new Prisma.Decimal(0));
  const inventoryByMedicine=new Map<string,number>();for(const batch of batches)inventoryByMedicine.set(batch.medicineId,(inventoryByMedicine.get(batch.medicineId)??0)+batch.availableQuantity+batch.quarantinedQuantity);
  const movementByMedicine=new Map(movements.map(m=>[m.medicineId,m._sum.quantity??0]));const reconciliations=[...new Set([...inventoryByMedicine.keys(),...movementByMedicine.keys()])].map(medicineId=>({medicineId,currentQuantity:inventoryByMedicine.get(medicineId)??0,movementNet:movementByMedicine.get(medicineId)??0,difference:(inventoryByMedicine.get(medicineId)??0)-(movementByMedicine.get(medicineId)??0)}));
  const periodRevenue=sales.reduce((sum,s)=>sum.add(s.totalAmount),new Prisma.Decimal(0)).sub(returns.reduce((sum,r)=>sum.add(r.refundAmount),new Prisma.Decimal(0)));
  res.json({data:{periodDays:days,periodRevenue:periodRevenue.toFixed(2),transactionCount:sales.length,returnValue:returns.reduce((sum,r)=>sum.add(r.refundAmount),new Prisma.Decimal(0)).toFixed(2),inventoryValuation:valuation.toFixed(2),valuationMethod:'Available units × batch purchase cost; expired batches excluded; quarantined units excluded.',daily,reconciliation:{balanced:reconciliations.every(row=>row.difference===0),items:reconciliations}}});
 }catch(error){next(error);}
});
