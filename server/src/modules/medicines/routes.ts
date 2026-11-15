import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { authenticate, allowRoles } from '../../middleware/auth.js';

export const medicinesRouter = Router();
medicinesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1); const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const search = String(req.query.search ?? '').trim();
    const where = { isActive: true, ...(search ? { OR: ['name','genericName','brand','sku','barcode'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' as const } })) } : {}) };
    const [items,total] = await Promise.all([prisma.medicine.findMany({ where, skip:(page-1)*pageSize, take:pageSize, orderBy:{name:'asc'}, include:{ category:true, batches:{where:{availableQuantity:{gt:0},expiryDate:{gt:new Date()}},select:{availableQuantity:true,expiryDate:true,sellingPrice:true}} } }),prisma.medicine.count({where})]);
    res.json({ data: items.map((m) => ({ ...m, stock: m.batches.reduce((n,b)=>n+b.availableQuantity,0), batchCount:m.batches.length, sellingPrice:m.batches[0]?.sellingPrice?.toString() ?? null, batches:undefined })), meta:{page,pageSize,total} });
  } catch(error) { next(error); }
});
const medicineInput = z.object({name:z.string().min(1),genericName:z.string().optional(),brand:z.string().optional(),sku:z.string().min(1),barcode:z.string().optional(),unit:z.string().default('unit'),reorderLevel:z.number().int().nonnegative().default(10),categoryId:z.string().optional()});
medicinesRouter.post('/', authenticate, allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER'), async (req,res,next) => {
  const data=medicineInput.safeParse(req.body); if(!data.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Medicine details are invalid',details:data.error.flatten()}});
  try { res.status(201).json({data:await prisma.medicine.create({data:data.data})}); } catch(error){next(error);}
});
