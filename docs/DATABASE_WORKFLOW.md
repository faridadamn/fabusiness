# Database Workflow

## Environments

- `production` Neon branch is the live source of truth.
- `development` Neon branch is used for local development and preview deployments.
- Application environments receive their connection through the server-only `DATABASE_URL` variable.

Never place a real connection string in source control or expose it through a `NEXT_PUBLIC_*` variable.

## Baseline

The reproducible Phase 0 schema is stored in:

```text
drizzle/0000_phase_zero_foundation.sql
```

The matching TypeScript table mapping is stored in:

```text
src/db/schema.ts
```

A schema change is incomplete until both the SQL migration and Drizzle schema reflect the same database contract.

## Development flow

1. Point `DATABASE_URL` to the Neon `development` branch.
2. Change `src/db/schema.ts`.
3. Generate or write a forward-only migration.
4. Review the SQL for destructive operations and lock risk.
5. Apply and verify it against a temporary or development branch.
6. Run typecheck, lint, tests, and build.
7. Apply the reviewed migration to production only after explicit approval.

## Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

`db:push` is reserved for disposable development environments. Production changes must use reviewed migration files.

## Ownership rule

All user-owned records contain `user_id`. Every application query must derive the current user from the authenticated server session and include the ownership condition. A client-provided user ID must never be trusted.

Foreign and absent records deliberately return the same authorization error to prevent record enumeration.

## Verification checklist

- Migration applies to an empty database.
- Existing development data remains valid.
- Foreign keys and indexes exist.
- User A cannot read or mutate User B's records.
- Health endpoint returns success.
- CI quality gates pass.
- Production application requires explicit approval.