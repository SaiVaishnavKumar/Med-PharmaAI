import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { authenticate, allowRoles } from '../../middleware/auth.js';

export const suppliersRouter=Router();
suppliersRouter.get('/',authenticate,async(_req,res,next)=>{try{res.json({data:await prisma.supplier.findMany({orderBy:{name:'asc'},include:{_count:{select:{purchases:true,batches:true}}}})});}catch(error){next(error);}});
const supplierInput=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().optional().or(z.literal('')),phone:z.string().max(40).optional(),address:z.string().max(500).optional()});
suppliersRouter.post('/',authenticate,allowRoles('SUPER_ADMIN','PHARMACY_MANAGER','INVENTORY_MANAGER'),async(req,res,next)=>{const parsed=supplierInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Supplier details are invalid',details:parsed.error.flatten()}});try{const data=parsed.data;res.status(201).json({data:await prisma.supplier.create({data:{...data,email:data.email||null}})});}catch(error){next(error);}});
