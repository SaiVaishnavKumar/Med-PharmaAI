# Database model

```mermaid
erDiagram
 User ||--o{ UserRole : has
 Role ||--o{ UserRole : assigned
 Role ||--o{ RolePermission : grants
 Permission ||--o{ RolePermission : contains
 MedicineCategory ||--o{ Medicine : groups
 Manufacturer ||--o{ Medicine : makes
 Medicine ||--o{ MedicineBatch : stocked_as
 Supplier ||--o{ MedicineBatch : supplies
 Supplier ||--o{ Purchase : receives
 Purchase ||--|{ PurchaseItem : contains
 Medicine ||--o{ PurchaseItem : ordered
 PurchaseItem ||--o| MedicineBatch : received_as
 Medicine ||--o{ SaleItem : sold_as
 Sale ||--|{ SaleItem : contains
 Sale ||--o{ SaleAllocation : consumes
 MedicineBatch ||--o{ SaleAllocation : allocated_from
 Sale ||--|| Invoice : billed_as
 Customer ||--o{ Sale : places
 User ||--o{ Sale : cashier
 Medicine ||--o{ StockMovement : tracks
 MedicineBatch ||--o{ StockMovement : source
 User ||--o{ AuditLog : performs
 StockAdjustment ||--|{ StockAdjustmentItem : records
 MedicineReturn ||--|{ ReturnItem : contains
 SaleItem ||--o{ ReturnItem : returned
```

The Prisma schema contains role/permission assignment, catalogue, suppliers/customers, purchases, batches, sale items and per-batch allocations, invoices/payments, returns, adjustments, stock movements, alerts/notifications, settings, tax configuration, audit log and AI insight records. Currency uses `Decimal`; batch identity is unique per medicine. The initial PostgreSQL migration includes database checks to prevent negative available and quarantined quantities. Migration generation and validation require Prisma CLI; applying it requires PostgreSQL.
