# Testing plan and current coverage

Run `npm test` for server unit tests and `npm run build` to type-check/build both workspaces after installing dependencies.

Current automated tests: 3 FEFO unit cases and 7 API boundary/security cases (health response, unauthenticated sale rejection, predictable 404, mandatory return/adjustment reasons, purchase RBAC, and Copilot medical-question refusal). Database acceptance tests still needed: sale stock/movement atomicity, concurrency, idempotency, login, purchase receipt-once behavior, valid returns/adjustments, alerts, report reconciliation, migration/seed from a clean database, and Playwright checkout. PostgreSQL and Docker were unavailable during initial implementation, so no database acceptance result is claimed.

## Manual acceptance checklist

1. Create two future-dated batches, sell across both, and inspect allocation and movement rows.
2. Attempt a sale from expired-only stock; expect an error and unchanged balances.
3. Create low-stock and near-expiry batches; verify alerts.
4. Submit return/adjustment without a reason; expect validation failure, then verify reason and audit history for valid operations.
5. Reconcile opening quantity + purchases + returned-to-stock quantity + adjustments − sales against available and quarantined stock.
