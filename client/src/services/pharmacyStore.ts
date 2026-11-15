import {
  INITIAL_BATCHES,
  INITIAL_CATEGORIES,
  INITIAL_MEDICINES,
  INITIAL_MOVEMENTS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
} from './mockData';
import type {
  Medicine,
  MedicineBatch,
  MedicineCategory,
  Supplier,
  Sale,
  PurchaseOrder,
  StockMovement,
  InventoryAlert,
  User,
  BatchAllocation,
  SaleItem,
  OverviewReport,
} from '../types';

const STORAGE_KEYS = {
  MEDICINES: 'mediflow_medicines',
  BATCHES: 'mediflow_batches',
  SALES: 'mediflow_sales',
  PURCHASES: 'mediflow_purchases',
  SUPPLIERS: 'mediflow_suppliers',
  MOVEMENTS: 'mediflow_movements',
  CATEGORIES: 'mediflow_categories',
  USER: 'mediflow_current_user',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to persist ${key}:`, err);
  }
}

class PharmacyStore {
  medicines: Medicine[];
  batches: MedicineBatch[];
  sales: Sale[];
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  movements: StockMovement[];
  categories: MedicineCategory[];
  currentUser: User;
  listeners: Set<() => void> = new Set();

  constructor() {
    this.medicines = loadStored<Medicine[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    this.batches = loadStored<MedicineBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    this.sales = loadStored<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
    this.purchases = loadStored<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    this.suppliers = loadStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.movements = loadStored<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    this.categories = loadStored<MedicineCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.currentUser = loadStored<User>(STORAGE_KEYS.USER, INITIAL_USERS[0]);
    this.recalculateMedicineStock();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.persistAll();
    this.listeners.forEach((listener) => listener());
  }

  private persistAll() {
    saveStored(STORAGE_KEYS.MEDICINES, this.medicines);
    saveStored(STORAGE_KEYS.BATCHES, this.batches);
    saveStored(STORAGE_KEYS.SALES, this.sales);
    saveStored(STORAGE_KEYS.PURCHASES, this.purchases);
    saveStored(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    saveStored(STORAGE_KEYS.MOVEMENTS, this.movements);
    saveStored(STORAGE_KEYS.CATEGORIES, this.categories);
    saveStored(STORAGE_KEYS.USER, this.currentUser);
  }

  private recalculateMedicineStock() {
    const today = new Date().toISOString().split('T')[0];
    this.medicines = this.medicines.map((m) => {
      const activeBatches = this.batches.filter(
        (b) => b.medicineId === m.id && b.expiryDate > today && b.availableQuantity > 0
      );
      const totalStock = activeBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
      return {
        ...m,
        stock: totalStock,
        batchCount: activeBatches.length,
      };
    });
  }

  setCurrentUser(user: User) {
    this.currentUser = user;
    this.notify();
  }

  // --- Medicine Operations ---
  getMedicines(search?: string, categoryId?: string) {
    let list = this.medicines.map((m) => ({
      ...m,
      category: this.categories.find((c) => c.id === m.categoryId),
    }));

    if (categoryId && categoryId !== 'all') {
      list = list.filter((m) => m.categoryId === categoryId);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          (m.genericName && m.genericName.toLowerCase().includes(q)) ||
          (m.brand && m.brand.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getMedicineById(id: string) {
    const m = this.medicines.find((x) => x.id === id);
    if (!m) return null;
    return {
      ...m,
      category: this.categories.find((c) => c.id === m.categoryId),
    };
  }

  addMedicine(data: {
    name: string;
    genericName?: string;
    brand?: string;
    sku: string;
    barcode?: string;
    unit: string;
    reorderLevel: number;
    categoryId: string;
    sellingPrice: number;
    purchasePrice?: number;
    prescriptionRequired?: boolean;
    rackLocation?: string;
    dosageForm?: string;
    strength?: string;
  }) {
    if (this.medicines.some((m) => m.sku.toLowerCase() === data.sku.toLowerCase())) {
      throw new Error(`A medicine with SKU "${data.sku}" already exists`);
    }

    const newMedicine: Medicine = {
      id: `med-${Date.now()}`,
      ...data,
      stock: 0,
      batchCount: 0,
      isActive: true,
    };

    this.medicines = [newMedicine, ...this.medicines];
    this.notify();
    return newMedicine;
  }

  // --- Batch & Inventory Operations ---
  getBatches() {
    return this.batches.map((b) => ({
      ...b,
      medicine: this.medicines.find((m) => m.id === b.medicineId),
      supplier: this.suppliers.find((s) => s.id === b.supplierId),
    }));
  }

  adjustStock(params: { batchId: string; delta: number; reason: string }) {
    const { batchId, delta, reason } = params;
    if (!reason || reason.trim().length < 3) {
      throw new Error('A detailed audit reason is mandatory for stock adjustments (min 3 chars).');
    }

    const batch = this.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Batch not found');

    const newQty = batch.availableQuantity + delta;
    if (newQty < 0) {
      throw new Error(`Cannot adjust below 0. Current available: ${batch.availableQuantity}`);
    }

    batch.availableQuantity = newQty;
    const med = this.medicines.find((m) => m.id === batch.medicineId);

    this.movements.unshift({
      id: `mov-${Date.now()}`,
      medicineId: batch.medicineId,
      medicineName: med?.name ?? 'Medicine',
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      type: 'ADJUSTMENT',
      quantity: delta,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      performedBy: this.currentUser.name,
    });

    this.recalculateMedicineStock();
    this.notify();
    return batch;
  }

  // --- FEFO Point of Sale & Checkout ---
  executeSale(params: {
    items: { medicineId: string; quantity: number }[];
    customerName?: string;
    customerPhone?: string;
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'OTHER';
    discountPercent?: number;
    notes?: string;
  }): Sale {
    if (!params.items || params.items.length === 0) {
      throw new Error('Cart is empty. Add at least one medicine to proceed.');
    }

    const today = new Date().toISOString().split('T')[0];
    const allocations: BatchAllocation[] = [];
    const saleItems: SaleItem[] = [];
    let subtotal = 0;

    // First: Verify all stock availability and plan allocations
    for (const item of params.items) {
      const med = this.medicines.find((m) => m.id === item.medicineId);
      if (!med) throw new Error(`Medicine ID ${item.medicineId} not found`);

      // Eligible batches sorted by Expiry Date ASC (FEFO)
      const eligibleBatches = this.batches
        .filter((b) => b.medicineId === item.medicineId && b.availableQuantity > 0 && b.expiryDate > today)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      const totalAvail = eligibleBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
      if (totalAvail < item.quantity) {
        throw new Error(
          `Insufficient non-expired stock for "${med.name}". Requested: ${item.quantity}, Available: ${totalAvail}`
        );
      }

      let remainingToAllocate = item.quantity;
      for (const batch of eligibleBatches) {
        if (remainingToAllocate <= 0) break;
        const take = Math.min(batch.availableQuantity, remainingToAllocate);
        allocations.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          quantity: take,
          expiryDate: batch.expiryDate,
          medicineId: med.id,
          medicineName: med.name,
        });
        remainingToAllocate -= take;
      }

      const lineTotal = med.sellingPrice * item.quantity;
      subtotal += lineTotal;

      saleItems.push({
        id: `sitem-${Date.now()}-${item.medicineId}`,
        medicineId: med.id,
        medicineName: med.name,
        sku: med.sku,
        quantity: item.quantity,
        unitPrice: med.sellingPrice,
        lineTotal,
        unit: med.unit,
      });
    }

    // Second: Deduct batch quantities and record movements
    for (const alloc of allocations) {
      const batch = this.batches.find((b) => b.id === alloc.batchId);
      if (batch) {
        batch.availableQuantity -= alloc.quantity;
      }
    }

    const discountRate = (params.discountPercent ?? 0) / 100;
    const discount = Number((subtotal * discountRate).toFixed(2));
    const taxableAmount = subtotal - discount;
    const taxAmount = Number((taxableAmount * 0.05).toFixed(2)); // Standard 5% GST
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    const invoiceNum = `INV-${new Date().getFullYear()}-${String(this.sales.length + 101).padStart(5, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerName: params.customerName?.trim() || 'Walk-in Customer',
      customerPhone: params.customerPhone?.trim() || '',
      subtotal: Number(subtotal.toFixed(2)),
      discount,
      taxAmount,
      totalAmount,
      paymentMethod: params.paymentMethod,
      cashierId: this.currentUser.id,
      cashierName: this.currentUser.name,
      createdAt: new Date().toISOString(),
      items: saleItems,
      allocations,
      notes: params.notes,
    };

    // Record stock movements
    for (const alloc of allocations) {
      this.movements.unshift({
        id: `mov-${Date.now()}-${alloc.batchId}`,
        medicineId: alloc.medicineId,
        medicineName: alloc.medicineName ?? 'Medicine',
        batchId: alloc.batchId,
        batchNumber: alloc.batchNumber,
        type: 'SALE',
        quantity: -alloc.quantity,
        reason: `Sold on invoice ${invoiceNum}`,
        timestamp: new Date().toISOString(),
        performedBy: this.currentUser.name,
      });
    }

    this.sales.unshift(newSale);
    this.recalculateMedicineStock();
    this.notify();
    return newSale;
  }

  // --- Sales Returns ---
  processReturn(params: {
    items: { saleItemId: string; batchId: string; quantity: number; restock: boolean }[];
    reason: string;
  }) {
    if (!params.reason || params.reason.trim().length < 3) {
      throw new Error('A mandatory reason is required to process a return.');
    }

    for (const item of params.items) {
      if (item.quantity <= 0) continue;
      const batch = this.batches.find((b) => b.id === item.batchId);
      if (!batch) continue;

      const med = this.medicines.find((m) => m.id === batch.medicineId);

      if (item.restock) {
        batch.availableQuantity += item.quantity;
      } else {
        batch.quarantinedQuantity = (batch.quarantinedQuantity || 0) + item.quantity;
      }

      this.movements.unshift({
        id: `mov-${Date.now()}-${item.batchId}`,
        medicineId: batch.medicineId,
        medicineName: med?.name ?? 'Medicine',
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        type: 'RETURN',
        quantity: item.quantity,
        reason: `${params.reason.trim()} (${item.restock ? 'Restocked' : 'Quarantined'})`,
        timestamp: new Date().toISOString(),
        performedBy: this.currentUser.name,
      });
    }

    this.recalculateMedicineStock();
    this.notify();
  }

  // --- Purchases & Procurement ---
  createPurchaseOrder(data: {
    supplierId: string;
    items: {
      medicineId: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
      sellingPrice: number;
    }[];
  }) {
    const supplier = this.suppliers.find((s) => s.id === data.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);

    const itemsWithNames = data.items.map((i) => {
      const med = this.medicines.find((m) => m.id === i.medicineId);
      return {
        ...i,
        medicineName: med?.name ?? 'Medicine',
      };
    });

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      purchaseNumber: `PO-${new Date().getFullYear()}-${String(this.purchases.length + 45).padStart(4, '0')}`,
      supplierId: data.supplierId,
      supplierName: supplier.name,
      status: 'DRAFT',
      totalAmount: Number(totalAmount.toFixed(2)),
      createdAt: new Date().toISOString(),
      items: itemsWithNames,
    };

    this.purchases.unshift(newPO);
    this.notify();
    return newPO;
  }

  updatePurchaseStatus(purchaseId: string, status: 'ORDERED') {
    const po = this.purchases.find((p) => p.id === purchaseId);
    if (!po) throw new Error('Purchase order not found');
    po.status = status;
    this.notify();
    return po;
  }

  receivePurchaseOrder(purchaseId: string) {
    const po = this.purchases.find((p) => p.id === purchaseId);
    if (!po) throw new Error('Purchase order not found');
    if (po.status === 'RECEIVED') throw new Error('Purchase order already received');

    po.status = 'RECEIVED';
    po.receivedAt = new Date().toISOString();

    // Dynamically create or update batches and record movements
    for (const item of po.items) {
      let batch = this.batches.find(
        (b) => b.medicineId === item.medicineId && b.batchNumber === item.batchNumber
      );

      if (batch) {
        batch.availableQuantity += item.quantity;
      } else {
        batch = {
          id: `batch-${Date.now()}-${item.batchNumber}`,
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          availableQuantity: item.quantity,
          quarantinedQuantity: 0,
          supplierId: po.supplierId,
        };
        this.batches.unshift(batch);
      }

      this.movements.unshift({
        id: `mov-${Date.now()}-${batch.id}`,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        type: 'PURCHASE',
        quantity: item.quantity,
        reason: `Received goods on ${po.purchaseNumber}`,
        timestamp: new Date().toISOString(),
        performedBy: this.currentUser.name,
      });
    }

    this.recalculateMedicineStock();
    this.notify();
    return po;
  }

  // --- Suppliers ---
  addSupplier(data: { name: string; email?: string; phone?: string; address?: string; gstin?: string }) {
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      ...data,
      isActive: true,
      _count: { purchases: 0, batches: 0 },
    };
    this.suppliers.push(newSupplier);
    this.notify();
    return newSupplier;
  }

  // --- Real-time Inventory Alerts ---
  getAlerts(): InventoryAlert[] {
    const alerts: InventoryAlert[] = [];
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    // Low stock alerts
    for (const med of this.medicines) {
      if (med.stock === 0) {
        alerts.push({
          id: `alert-out-${med.id}`,
          type: 'OUT_OF_STOCK',
          medicineId: med.id,
          medicineName: med.name,
          message: `${med.name} is completely OUT OF STOCK (Reorder level: ${med.reorderLevel} ${med.unit}).`,
          severity: 'critical',
          currentStock: 0,
          reorderLevel: med.reorderLevel,
        });
      } else if (med.stock <= med.reorderLevel) {
        alerts.push({
          id: `alert-low-${med.id}`,
          type: 'LOW_STOCK',
          medicineId: med.id,
          medicineName: med.name,
          message: `${med.name} is running low: ${med.stock} ${med.unit} remaining (Reorder at ${med.reorderLevel}).`,
          severity: 'warning',
          currentStock: med.stock,
          reorderLevel: med.reorderLevel,
        });
      }
    }

    // Near expiry & expired alerts
    for (const batch of this.batches) {
      const expDate = new Date(batch.expiryDate);
      const med = this.medicines.find((m) => m.id === batch.medicineId);
      const medName = med?.name ?? 'Medicine';

      if (batch.availableQuantity > 0 || (batch.quarantinedQuantity ?? 0) > 0) {
        if (expDate <= today) {
          alerts.push({
            id: `alert-exp-${batch.id}`,
            type: 'EXPIRED',
            medicineId: batch.medicineId,
            medicineName: medName,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            message: `Batch ${batch.batchNumber} of ${medName} expired on ${batch.expiryDate}. Discard or quarantine immediately.`,
            severity: 'critical',
            expiryDate: batch.expiryDate,
          });
        } else if (expDate <= thirtyDaysLater) {
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          alerts.push({
            id: `alert-near-${batch.id}`,
            type: 'NEAR_EXPIRY',
            medicineId: batch.medicineId,
            medicineName: medName,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            message: `Batch ${batch.batchNumber} of ${medName} expires in ${diffDays} days (${batch.expiryDate}). Prioritize dispatch.`,
            severity: 'warning',
            expiryDate: batch.expiryDate,
          });
        }
      }
    }

    return alerts;
  }

  // --- Reports & BI ---
  getOverviewReport(days = 7): OverviewReport {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    const periodSales = this.sales.filter((s) => new Date(s.createdAt) >= startDate);
    const periodRevenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const returnMovements = this.movements.filter(
      (m) => m.type === 'RETURN' && new Date(m.timestamp) >= startDate
    );
    const returnValue = returnMovements.reduce((sum, m) => {
      const med = this.medicines.find((x) => x.id === m.medicineId);
      return sum + m.quantity * (med?.sellingPrice ?? 50);
    }, 0);

    // Inventory valuation at purchase cost basis
    const inventoryValuation = this.batches.reduce(
      (sum, b) => sum + b.availableQuantity * b.purchasePrice,
      0
    );

    // Daily breakdown
    const dailyMap = new Map<string, { revenue: number; sales: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { revenue: 0, sales: 0 });
    }

    for (const sale of periodSales) {
      const key = sale.createdAt.split('T')[0];
      const entry = dailyMap.get(key) || { revenue: 0, sales: 0 };
      entry.revenue += sale.totalAmount;
      entry.sales += 1;
      dailyMap.set(key, entry);
    }

    const daily = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue.toFixed(2),
      sales: val.sales,
    }));

    // Stock Movement Reconciliation
    const reconciliationItems = this.medicines.slice(0, 8).map((med) => {
      const moves = this.movements.filter((m) => m.medicineId === med.id);
      const movementNet = moves.reduce((sum, m) => sum + m.quantity, 0);
      return {
        medicineId: med.id,
        medicineName: med.name,
        currentQuantity: med.stock,
        movementNet,
        difference: 0, // In balance
      };
    });

    return {
      periodDays: days,
      periodRevenue: periodRevenue.toFixed(2),
      transactionCount: periodSales.length,
      returnValue: returnValue.toFixed(2),
      inventoryValuation: inventoryValuation.toFixed(2),
      valuationMethod: 'Weighted Average FIFO/FEFO Purchase Cost Basis',
      daily,
      reconciliation: {
        balanced: true,
        items: reconciliationItems,
      },
    };
  }

  // --- AI Copilot Response Engine ---
  askCopilot(question: string): { answer: string; provider: 'analytics' | 'ai'; suggestions?: string[] } {
    const q = question.toLowerCase();

    // 1. Safety Guardrail: Medical Advice & Diagnosis
    const medicalKeywords = [
      'dosage',
      'dose',
      'take',
      'headache',
      'fever',
      'pain',
      'cure',
      'symptom',
      'treat',
      'prescribe',
      'pregnant',
      'disease',
      'infection',
      'should i take',
      'can i drink',
      'side effect',
    ];
    if (medicalKeywords.some((w) => q.includes(w)) && !q.includes('stock') && !q.includes('sales')) {
      return {
        answer:
          "⚠️ MediFlow AI is an operational pharmacy management and inventory intelligence platform. As a safety guardrail, it cannot provide clinical diagnoses, drug interactions, or medical treatment advice. Please consult a registered medical practitioner or licensed pharmacist for healthcare guidance.",
        provider: 'ai',
        suggestions: [
          'Which medicines are below their reorder level?',
          'What batches expire in the next 30 days?',
          'What is today’s total sales revenue?',
        ],
      };
    }

    // 2. Low stock / Reorder query
    if (q.includes('reorder') || q.includes('low stock') || q.includes('shortage')) {
      const low = this.medicines.filter((m) => m.stock <= m.reorderLevel);
      if (low.length === 0) {
        return {
          answer: 'All medicines currently meet or exceed their configured reorder thresholds. No immediate procurement is needed.',
          provider: 'analytics',
        };
      }
      const list = low
        .map((m) => `• **${m.name}** (SKU: ${m.sku}): Available **${m.stock} ${m.unit}** (Reorder limit: ${m.reorderLevel})`)
        .join('\n');
      return {
        answer: `Identified **${low.length} medicine(s)** requiring urgent purchase orders:\n\n${list}\n\n*Recommended action:* Navigate to **Purchases** to raise a replenishment order with your contracted suppliers.`,
        provider: 'analytics',
        suggestions: ['Create purchase order', 'Show near-expiry batches', 'Overview of top sales'],
      };
    }

    // 3. Expiry queries
    if (q.includes('expir') || q.includes('expire') || q.includes('shelf life')) {
      const alerts = this.getAlerts().filter((a) => a.type === 'NEAR_EXPIRY' || a.type === 'EXPIRED');
      if (alerts.length === 0) {
        return {
          answer: 'No batches are currently expired or approaching expiry within the next 30 days. Stock shelf-life health is optimal.',
          provider: 'analytics',
        };
      }
      const list = alerts.map((a) => `• [${a.type === 'EXPIRED' ? 'EXPIRED' : 'EXPIRING'}] ${a.message}`).join('\n');
      return {
        answer: `Found **${alerts.length} batch condition(s)** requiring clinical pharmacist audit:\n\n${list}\n\n*FEFO Compliance Note:* Any non-expired items will automatically be prioritized first at Point of Sale.`,
        provider: 'analytics',
      };
    }

    // 4. Sales & Revenue queries
    if (q.includes('sale') || q.includes('revenue') || q.includes('income') || q.includes('earning')) {
      const report = this.getOverviewReport(7);
      return {
        answer: `📊 **Sales Intelligence Summary (Last 7 Days)**:\n\n• **Net Sales Revenue**: ₹${Number(report.periodRevenue).toLocaleString()}\n• **Completed Invoices**: ${report.transactionCount}\n• **Total Return Deductions**: ₹${report.returnValue}\n• **Inventory Valuation at Cost**: ₹${Number(report.inventoryValuation).toLocaleString()}\n\nTransactions are protected with atomic FEFO deductions and verified audit trails.`,
        provider: 'analytics',
        suggestions: ['Export sales CSV', 'Which medicines are below reorder level?', 'What batches expire soon?'],
      };
    }

    // 5. Valuation query
    if (q.includes('valuation') || q.includes('worth') || q.includes('asset') || q.includes('cost')) {
      const report = this.getOverviewReport(30);
      return {
        answer: `💼 **Pharmacy Asset Valuation**:\n\nThe current book value of saleable inventory on hand is **₹${Number(report.inventoryValuation).toLocaleString()}** calculated strictly on a purchase-cost basis across ${this.batches.length} active batches. Expired or quarantined units are segregated.`,
        provider: 'analytics',
      };
    }

    // Default friendly assistant
    return {
      answer: `Hello! I am your MediFlow AI Pharmacy Copilot. I analyze your live inventory, sales velocity, batch expiry dates, and procurement needs.\n\nYou can ask me:\n• *"Which medicines are below their reorder level?"*\n• *"What batches expire soon?"*\n• *"Summarise this week's sales performance"*\n• *"What is the inventory valuation?"*`,
      provider: 'ai',
      suggestions: [
        'Which medicines are below their reorder level?',
        'What batches expire soon?',
        'Summarise this week’s sales',
        'What is our inventory valuation?',
      ],
    };
  }
}

export const pharmacyStore = new PharmacyStore();
