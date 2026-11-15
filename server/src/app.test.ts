import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from './app.js';
process.env.JWT_SECRET='test-secret';
const auth=(roles:string[])=>`mediflow_session=${jwt.sign({id:'test-user',roles},'test-secret')}`;

describe('API boundary',()=>{
  it('reports service health with the shared response envelope',async()=>{
    const response=await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.data?.status).toBe('ok');
  });
  it('requires a session for sale creation',async()=>{
    const response=await request(app).post('/api/v1/sales').send({items:[{medicineId:'x',quantity:1}],paymentMethod:'CASH'});
    expect(response.status).toBe(401);
  });
  it('returns a predictable not found error',async()=>{
    const response=await request(app).get('/api/v1/missing');
    expect(response.status).toBe(404);
    expect(response.body.error?.code).toBe('NOT_FOUND');
  });
  it('rejects return requests without a mandatory reason before database access',async()=>{
    const response=await request(app).post('/api/v1/inventory/returns').set('Cookie',auth(['PHARMACIST'])).send({items:[{saleItemId:'item-1',batchId:'batch-1',quantity:1,restock:false}]});
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('VALIDATION_ERROR');
  });
  it('rejects adjustments without a mandatory reason before database access',async()=>{
    const response=await request(app).post('/api/v1/inventory/adjustments').set('Cookie',auth(['INVENTORY_MANAGER'])).send({batchId:'batch-1',delta:-1});
    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('VALIDATION_ERROR');
  });
  it('enforces server roles on purchase creation',async()=>{
    const response=await request(app).post('/api/v1/purchases').set('Cookie',auth(['CASHIER'])).send({supplierId:'supplier-1',items:[]});
    expect(response.status).toBe(403);
  });
  it('refuses medical advice questions in the Copilot',async()=>{
    const response=await request(app).post('/api/v1/ai/ask').set('Cookie',auth(['PHARMACIST'])).send({question:'What dosage should I take for a headache?'});
    expect(response.status).toBe(200);
    expect(response.body.data?.answer).toContain('can’t provide medical');
  });
});
