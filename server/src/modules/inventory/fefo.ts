export type BatchStock = { id: string; expiryDate: Date; availableQuantity: number };
export type BatchAllocation = { batchId: string; quantity: number };

export function allocateFEFO(batches: BatchStock[], quantity: number, at = new Date()): BatchAllocation[] {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantity must be a positive whole number');
  let remaining = quantity;
  const eligible = [...batches].filter((b) => b.expiryDate > at && b.availableQuantity > 0)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime() || a.id.localeCompare(b.id));
  const allocation: BatchAllocation[] = [];
  for (const batch of eligible) {
    const taken = Math.min(remaining, batch.availableQuantity);
    if (taken) allocation.push({ batchId: batch.id, quantity: taken });
    remaining -= taken;
    if (!remaining) break;
  }
  if (remaining) throw new Error('Insufficient non-expired stock');
  return allocation;
}
