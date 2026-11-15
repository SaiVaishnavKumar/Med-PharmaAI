export type RoleName =
  | 'SUPER_ADMIN'
  | 'PHARMACY_MANAGER'
  | 'PHARMACIST'
  | 'CASHIER'
  | 'INVENTORY_MANAGER'
  | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  roles: string[];
  avatar?: string;
}

export interface MedicineCategory {
  id: string;
  name: string;
  description?: string;
  code?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brand?: string;
  sku: string;
  barcode?: string;
  unit: string;
  reorderLevel: number;
  categoryId?: string;
  category?: MedicineCategory;
  stock: number;
  batchCount: number;
  sellingPrice: number;
  purchasePrice?: number;
  prescriptionRequired?: boolean;
  rackLocation?: string;
  dosageForm?: string;
  strength?: string;
  isActive: boolean;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  availableQuantity: number;
  quarantinedQuantity: number;
  supplierId?: string;
  supplier?: { id: string; name: string };
  medicine?: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
    reorderLevel?: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  isActive: boolean;
  _count: {
    purchases: number;
    batches: number;
  };
}

export interface SaleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unit: string;
}

export interface BatchAllocation {
  batchId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  medicineId: string;
  medicineName?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER';
  cashierId: string;
  cashierName: string;
  createdAt: string;
  items: SaleItem[];
  allocations: BatchAllocation[];
  notes?: string;
}

export interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  receivedAt?: string;
  items: PurchaseItem[];
}

export interface InventoryAlert {
  id: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY' | 'EXPIRED';
  medicineId: string;
  medicineName: string;
  batchId?: string;
  batchNumber?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  expiryDate?: string;
  currentStock?: number;
  reorderLevel?: number;
}

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  batchId?: string;
  batchNumber?: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'OPENING';
  quantity: number;
  reason: string;
  timestamp: string;
  performedBy: string;
}

export interface ReturnItem {
  saleItemId: string;
  batchId: string;
  quantity: number;
  restock: boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: 'ai' | 'analytics';
  suggestions?: string[];
}

export interface OverviewReport {
  periodDays: number;
  periodRevenue: string;
  transactionCount: number;
  returnValue: string;
  inventoryValuation: string;
  valuationMethod: string;
  daily: { date: string; revenue: string; sales: number }[];
  reconciliation: {
    balanced: boolean;
    items: {
      medicineId: string;
      medicineName: string;
      currentQuantity: number;
      movementNet: number;
      difference: number;
    }[];
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
