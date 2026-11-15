# API reference (implemented routes)

Base path `/api/v1`. Success response: `{ "data": ..., "meta": ... }`; error response: `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Service health |
| POST | `/auth/login` | Public, rate-limited | Validate credentials and set HTTP-only cookie |
| POST | `/auth/logout` | Public | Clear session cookie |
| GET | `/auth/me` | Authenticated | Current account and roles |
| GET | `/medicines?page=1&pageSize=20&search=...` | Authenticated | Search and paginate medicines; stock excludes expired batches |
| POST | `/medicines` | Admin, manager, inventory manager | Create a validated medicine |
| POST | `/sales` | Authenticated | FEFO sale; optional `Idempotency-Key` prevents duplicate sale creation |
| GET | `/sales?page=1&pageSize=20&search=...` | Authenticated | Search recent invoices |
| GET | `/sales/invoices/:invoiceNumber` | Authenticated | Read invoice details and batch allocations |
| GET | `/inventory/alerts` | Authenticated | Computed low-stock, configured near-expiry, and expired-batch alerts |
| POST | `/inventory/adjustments` | Admin, manager, inventory manager | Reason-required atomic batch adjustment with movement and audit entries |
| POST | `/inventory/returns` | Admin, manager, pharmacist | Reason-required return linked to original sale batch; restock or quarantine |
| GET | `/inventory/batches` | Authenticated | Batch-level quantities, cost, expiry and supplier |
| GET | `/inventory/movements` | Authenticated | Paginated stock movement history |
| GET | `/purchases` | Manager, inventory manager, auditor | List recent orders |
| POST | `/purchases` | Manager, inventory manager | Create a validated purchase draft |
| PATCH | `/purchases/:id/status` | Manager, inventory manager | Move a draft to ordered or cancel |
| POST | `/purchases/:id/receive` | Manager, inventory manager | Receive an ordered purchase into batch stock exactly once |
| GET/POST | `/suppliers` | Authenticated / manager, inventory manager | List or create suppliers |
| POST | `/ai/ask` | Authenticated | Query fixed business analytics; deterministic response works without Gemini |
| GET | `/reports/overview?days=7` | Manager, pharmacist, inventory manager, auditor | Net revenue, inventory valuation, daily buckets, and stock movement reconciliation |

Detailed category/supplier/profit analytics, settings and OpenAPI endpoints are not implemented yet. Purchase receiving handles full orders; partial receipts are not available. Swagger URL will be documented when generated.
