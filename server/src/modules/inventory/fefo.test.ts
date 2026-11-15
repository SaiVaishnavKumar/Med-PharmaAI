import { describe, expect, it } from 'vitest';
import { allocateFEFO } from './fefo.js';
const now = new Date('2026-11-12T00:00:00Z');
describe('FEFO allocation',()=>{
  it('uses earliest expiry first and splits across batches',()=>{
    expect(allocateFEFO([{id:'later',expiryDate:new Date('2027-06-01'),availableQuantity:8},{id:'first',expiryDate:new Date('2027-01-01'),availableQuantity:3}],5,now)).toEqual([{batchId:'first',quantity:3},{batchId:'later',quantity:2}]);
  });
  it('rejects expired batches and insufficient non-expired stock',()=>{
    expect(()=>allocateFEFO([{id:'expired',expiryDate:new Date('2026-01-01'),availableQuantity:10}],1,now)).toThrow('Insufficient');
  });
  it('rejects invalid quantities',()=>expect(()=>allocateFEFO([],0,now)).toThrow('positive whole number'));
});
