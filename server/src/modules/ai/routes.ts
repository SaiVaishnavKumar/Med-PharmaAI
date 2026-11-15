import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db.js';
import { authenticate } from '../../middleware/auth.js';
import { GeminiProvider } from './provider.js';

export const aiRouter=Router();
const askSchema=z.object({question:z.string().trim().min(3).max(500)});
const medicalTerms=/\b(diagnos(e|is)|treat(ment)?|dos(age|ing)|prescrib(e|ing)|substitut(e|ion)|what should i take|symptom|cure)\b/i;

async function answerBusinessQuestion(question:string){
  const q=question.toLowerCase();
  if(medicalTerms.test(q))return {answer:'I can help with pharmacy operations and inventory only. I can’t provide medical or treatment advice.',facts:{}};
  if(q.includes('low stock')||q.includes('reorder')||q.includes('restock')){
    const now=new Date();const medicines=await prisma.medicine.findMany({where:{isActive:true},include:{batches:{where:{availableQuantity:{gt:0},expiryDate:{gt:now}},select:{availableQuantity:true}}},orderBy:{name:'asc'}});
    const low=medicines.map((m)=>({name:m.name,sku:m.sku,stock:m.batches.reduce((n,b)=>n+b.availableQuantity,0),reorderLevel:m.reorderLevel})).filter((m)=>m.stock<=m.reorderLevel);
    return {answer:low.length?`${low.length} medicines are at or below their reorder level: ${low.slice(0,8).map((m)=>`${m.name} (${m.stock} on hand, reorder at ${m.reorderLevel})`).join('; ')}.`:'No active medicines are currently below their reorder levels.',facts:low};
  }
  if(q.includes('expir')||q.includes('near expiry')){
    const now=new Date(),settings=await prisma.pharmacySettings.findFirst(),until=new Date(now);until.setDate(until.getDate()+(settings?.nearExpiryDays??30));
    const batches=await prisma.medicineBatch.findMany({where:{availableQuantity:{gt:0},expiryDate:{gt:now,lte:until}},include:{medicine:{select:{name:true}}},orderBy:{expiryDate:'asc'},take:50});
    return {answer:batches.length?`${batches.length} batches expire within the next ${settings?.nearExpiryDays??30} days: ${batches.slice(0,8).map((b)=>`${b.medicine.name} (${b.batchNumber}, ${b.expiryDate.toISOString().slice(0,10)})`).join('; ')}.`:'No active batches are within the configured near-expiry window.',facts:batches.map((b)=>({medicine:b.medicine.name,batch:b.batchNumber,expiry:b.expiryDate,quantity:b.availableQuantity}))};
  }
  if(q.includes('sales')||q.includes('revenue')){
    const now=new Date(),monthStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));const aggregate=await prisma.sale.aggregate({where:{createdAt:{gte:monthStart}},_sum:{totalAmount:true},_count:{_all:true}});const amount=aggregate._sum.totalAmount?.toFixed(2)??'0.00';
    return {answer:`Recorded sales this month: ${aggregate._count._all} transactions totalling ₹${amount} in revenue. Revenue is not profit.`,facts:{count:aggregate._count._all,revenue:amount,periodStart:monthStart.toISOString()}};
  }
  if(q.includes('inventory value')||q.includes('stock value')||q.includes('valuation')){
    const batches=await prisma.medicineBatch.findMany({where:{availableQuantity:{gt:0},expiryDate:{gt:new Date()}},select:{availableQuantity:true,purchasePrice:true}});const value=batches.reduce((sum,b)=>sum.add(b.purchasePrice.mul(b.availableQuantity)),new Prisma.Decimal(0));
    return {answer:`Estimated saleable inventory value at purchase cost is ₹${value.toFixed(2)} across ${batches.length} eligible batches. Expired batches are excluded.`,facts:{method:'available units × batch purchase cost; expired stock excluded',batchCount:batches.length,value:value.toFixed(2)}};
  }
  return {answer:'I can answer questions about low stock, near-expiry batches, this month’s sales, and saleable inventory value. Please ask about one of those business topics.',facts:{supportedTopics:['low stock','near expiry','monthly sales','inventory value']}};
}

aiRouter.post('/ask',authenticate,async(req,res,next)=>{
  const parsed=askSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Enter a business operations question',details:parsed.error.flatten()}});
  try{
    const result=await answerBusinessQuestion(parsed.data.question);let answer=result.answer;let provider='deterministic';
    if(!medicalTerms.test(parsed.data.question)&&process.env.GEMINI_API_KEY&&result.facts&&Object.keys(result.facts as object).length){try{answer=await new GeminiProvider().summarize(parsed.data.question,result);provider='gemini';}catch{provider='deterministic';}}
    res.json({data:{answer,provider}});
  }catch(error){next(error);}
});
