import { pharmacyStore } from './services/pharmacyStore';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });

    if (response.ok) {
      const body = await response.json();
      return body as T;
    }

    // If unauthenticated or backend error, try local mock store
    return handleFallback<T>(path, init);
  } catch (_networkError) {
    // Network failure (server down or offline), fallback seamlessly to rich local store
    return handleFallback<T>(path, init);
  }
}

function handleFallback<T>(path: string, init?: RequestInit): T {
  const method = init?.method?.toUpperCase() ?? 'GET';
  const url = new URL(`http://localhost${path}`);
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // GET /medicines
  if (pathname === '/medicines' && method === 'GET') {
    const search = searchParams.get('search') ?? '';
    const items = pharmacyStore.getMedicines(search);
    return {
      data: items,
      meta: { page: 1, pageSize: items.length, total: items.length },
    } as unknown as T;
  }

  // POST /medicines
  if (pathname === '/medicines' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const result = pharmacyStore.addMedicine(body);
    return { data: result } as unknown as T;
  }

  // GET /inventory/batches
  if (pathname === '/inventory/batches' && method === 'GET') {
    const batches = pharmacyStore.getBatches();
    return { data: batches } as unknown as T;
  }

  // POST /inventory/adjustments
  if (pathname === '/inventory/adjustments' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const result = pharmacyStore.adjustStock(body);
    return { data: result } as unknown as T;
  }

  // POST /inventory/returns
  if (pathname === '/inventory/returns' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    pharmacyStore.processReturn(body);
    return { data: { success: true } } as unknown as T;
  }

  // GET /inventory/alerts
  if (pathname === '/inventory/alerts' && method === 'GET') {
    const alerts = pharmacyStore.getAlerts();
    return { data: alerts } as unknown as T;
  }

  // GET /sales
  if (pathname === '/sales' && method === 'GET') {
    const search = (searchParams.get('search') ?? '').toLowerCase();
    let sales = pharmacyStore.sales;
    if (search) {
      sales = sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(search) ||
          (s.customerName && s.customerName.toLowerCase().includes(search))
      );
    }
    return {
      data: sales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        createdAt: s.createdAt,
        totalAmount: s.totalAmount.toFixed(2),
        paymentMethod: s.paymentMethod,
        customer: s.customerName ? { name: s.customerName, phone: s.customerPhone } : null,
        cashier: { name: s.cashierName },
      })),
      meta: { page: 1, pageSize: sales.length, total: sales.length },
    } as unknown as T;
  }

  // GET /sales/invoices/:invoiceNumber
  if (pathname.startsWith('/sales/invoices/') && method === 'GET') {
    const invoiceNumber = decodeURIComponent(pathname.replace('/sales/invoices/', ''));
    const sale = pharmacyStore.sales.find((s) => s.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase());
    if (!sale) throw new Error(`Invoice "${invoiceNumber}" not found`);

    return {
      data: {
        invoiceNumber: sale.invoiceNumber,
        issuedAt: sale.createdAt,
        sale: {
          subtotal: sale.subtotal.toFixed(2),
          discount: sale.discount.toFixed(2),
          taxAmount: sale.taxAmount.toFixed(2),
          totalAmount: sale.totalAmount.toFixed(2),
          paymentMethod: sale.paymentMethod,
          createdAt: sale.createdAt,
          cashier: { name: sale.cashierName },
          customer: sale.customerName ? { name: sale.customerName, phone: sale.customerPhone ?? null } : null,
          items: sale.items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice.toFixed(2),
            lineTotal: i.lineTotal.toFixed(2),
            medicine: { name: i.medicineName, sku: i.sku },
          })),
          allocations: sale.allocations.map((a) => ({
            quantity: a.quantity,
            batch: {
              batchNumber: a.batchNumber,
              expiryDate: a.expiryDate,
              medicine: { id: a.medicineId, name: a.medicineName ?? 'Medicine' },
            },
          })),
          payments: [{ amount: sale.totalAmount.toFixed(2), method: sale.paymentMethod }],
        },
      },
    } as unknown as T;
  }

  // POST /sales
  if (pathname === '/sales' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const sale = pharmacyStore.executeSale({
      items: body.items,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      paymentMethod: body.paymentMethod ?? 'CASH',
      discountPercent: body.discountPercent,
      notes: body.notes,
    });
    return { data: { invoiceNumber: sale.invoiceNumber } } as unknown as T;
  }

  // GET /purchases
  if (pathname === '/purchases' && method === 'GET') {
    return {
      data: pharmacyStore.purchases.map((p) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        status: p.status,
        totalAmount: p.totalAmount.toFixed(2),
        supplier: { name: p.supplierName },
        createdAt: p.createdAt,
        items: p.items.map((i) => ({
          medicine: { name: i.medicineName },
          quantity: i.quantity,
        })),
      })),
    } as unknown as T;
  }

  // POST /purchases
  if (pathname === '/purchases' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const po = pharmacyStore.createPurchaseOrder(body);
    return { data: po } as unknown as T;
  }

  // PATCH /purchases/:id/status
  if (pathname.includes('/purchases/') && pathname.endsWith('/status') && method === 'PATCH') {
    const parts = pathname.split('/');
    const id = parts[parts.length - 2];
    const po = pharmacyStore.updatePurchaseStatus(id, 'ORDERED');
    return { data: po } as unknown as T;
  }

  // POST /purchases/:id/receive
  if (pathname.includes('/purchases/') && pathname.endsWith('/receive') && method === 'POST') {
    const parts = pathname.split('/');
    const id = parts[parts.length - 2];
    const po = pharmacyStore.receivePurchaseOrder(id);
    return { data: po } as unknown as T;
  }

  // GET /suppliers
  if (pathname === '/suppliers' && method === 'GET') {
    return { data: pharmacyStore.suppliers } as unknown as T;
  }

  // POST /suppliers
  if (pathname === '/suppliers' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const sup = pharmacyStore.addSupplier(body);
    return { data: sup } as unknown as T;
  }

  // GET /reports/overview
  if (pathname === '/reports/overview' && method === 'GET') {
    const days = Number(searchParams.get('days') ?? 7);
    const report = pharmacyStore.getOverviewReport(days);
    return { data: report } as unknown as T;
  }

  // POST /ai/ask
  if (pathname === '/ai/ask' && method === 'POST') {
    const body = JSON.parse(init?.body as string);
    const res = pharmacyStore.askCopilot(body.question ?? '');
    return { data: res } as unknown as T;
  }

  // Fallback default
  return { data: {} } as unknown as T;
}
