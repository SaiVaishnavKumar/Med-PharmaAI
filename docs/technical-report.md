# Technical report

## Objective and problem

Pharmacy teams need dependable visibility into products, expiry dates and sales. A medicine-level stock total cannot safely represent separate supplier batches and expiry dates. MediFlow models batches explicitly and allocates sales from eligible stock by earliest expiry.

## Proposed solution and technology

React/TypeScript with Vite provides the browser application; a TypeScript Express REST API and Prisma-backed PostgreSQL database provide business operations and durable data. The modular monolith keeps stock rules in one transaction boundary. Optional AI is isolated from core workflows and is not required for operation.

## Data, rules and security

Medicine batches carry expiry, purchase cost, sale price, and received/available quantities. Sale inputs are validated on the server. The server excludes expired or empty batches, orders eligible batches by expiry, conditionally decrements stock, and records allocations/movements in a serializable transaction. Transaction failure rolls back deductions. Currency uses decimal fields. Passwords are hashed; authentication uses an HTTP-only SameSite cookie; Helmet, CORS, a request-size limit, login throttling and role middleware provide additional controls. AI-generated SQL is not used.

## Testing and current status

Unit tests cover FEFO ordering, split allocation, expired stock exclusion, and invalid quantities. Full database acceptance tests and browser journeys require dependencies and PostgreSQL. No migration, live database or deployment result is asserted. See `DEVELOPMENT_STATUS.md`.

## Future work

The supplied workspace was empty and the environment lacked PostgreSQL/Docker. Next work should validate purchase receiving and reason-required returns/adjustments against a database, add report reconciliation, OpenAPI, invoice printing/export, and browser journeys. Gemini can summarize permission-checked analytics, with deterministic calculations as the source of facts.
