# System architecture

```mermaid
flowchart LR
 Browser[React + TypeScript + Vite] -->|REST /api/v1 and HTTP-only cookie| API[Express modular monolith]
 API --> Auth[Auth and server RBAC]
 API --> Catalog[Medicine catalogue]
 API --> Inventory[Batch stock and FEFO]
 API --> Sales[Sales and invoices]
 API --> Reports[Reports and safe analytics]
 Auth --> Prisma[Prisma ORM]
 Catalog --> Prisma
 Inventory --> Prisma
 Sales --> Prisma
 Reports --> Prisma
 Prisma --> DB[(PostgreSQL)]
 Copilot[Optional AI provider] -. approved analytics only .-> Reports
```

The API owns validation, authorization, inventory availability and calculations. A sale is processed in a serializable Prisma transaction. Batch updates are conditional, so stale requests cannot decrement a batch below zero. The browser only displays values and submits quantities; it is never the stock authority. UTC timestamps are stored in the database; pharmacy timezone is a setting.

The API reads `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, `COOKIE_SECURE`, and optional Gemini configuration from the server environment. Secrets must not be included in client bundles.
