import { Router } from 'express';
import { prisma } from '../../db.js';
import { authenticate } from '../../middleware/auth.js';

export const invoicesRouter=Router();
invoicesRouter.get('/:invoiceNumber',authenticate,async(req,res,next)=>{
  try{const invoice=await prisma.invoice.findUnique({where:{invoiceNumber:String(req.params.invoiceNumber)},include:{sale:{include:{items:{include:{medicine:true}},allocations:{include:{batch:{include:{medicine:true}}}},customer:true,cashier:{select:{name:true}},payments:true}}}});if(!invoice)return res.status(404).json({error:{code:'NOT_FOUND',message:'Invoice not found'}});res.json({data:invoice});}catch(error){next(error);}
});
