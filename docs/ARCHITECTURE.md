# Technical Architecture

## Architecture style

FA Business OS menggunakan modular monolith untuk MVP. Tujuannya menjaga kecepatan pengembangan tanpa kehilangan batas domain yang jelas.

## Runtime

- Next.js App Router untuk UI dan server-side application boundary
- TypeScript strict mode
- Supabase PostgreSQL sebagai source of truth
- Supabase Auth untuk authentication
- Supabase Storage untuk attachment
- Row Level Security untuk data isolation

## Application layers

1. **Presentation** — route, page, form, table, dashboard, and responsive navigation.
2. **Application** — use case, validation, authorization-aware command/query handling.
3. **Domain** — scoring, project limits, priority ranking, project health, revenue calculations.
4. **Infrastructure** — Supabase clients, storage, scheduled jobs, AI provider adapters, integrations.

## Proposed source structure

```text
src/
  app/
  components/
    ui/
    layout/
  features/
    auth/
    goals/
    revenue-engines/
    projects/
    tasks/
    time-tracking/
    products/
    crm/
    finance/
    content/
    knowledge/
    reviews/
    ai/
  lib/
    supabase/
    validation/
    errors/
    dates/
  server/
    services/
    repositories/
    policies/
  types/
supabase/
  migrations/
  seed.sql
```

## Security boundaries

- Browser hanya menerima public URL dan anon key.
- Service role key hanya tersedia pada trusted server runtime.
- Semua tabel user-owned memiliki `owner_id` yang merujuk ke `auth.users.id`.
- RLS wajib aktif sebelum tabel dianggap siap digunakan.
- Server tetap melakukan authorization checks; RLS adalah lapisan pertahanan tambahan.
- Audit log digunakan untuk perubahan status, override, export, AI action, dan destructive action.

## Data strategy

- UUID sebagai primary key untuk business records.
- `created_at`, `updated_at`, dan optional `deleted_at` pada entity utama.
- Enum bisnis disimpan sebagai constrained text atau lookup table sesuai kebutuhan perubahan.
- Monetary values menggunakan numeric, bukan floating point.
- Duration disimpan dalam integer minutes.
- Semua timestamp disimpan sebagai UTC dan ditampilkan menggunakan timezone pengguna.

## AI strategy

AI bukan sumber kebenaran. Rule engine menghitung metric, risk, priority, dan evidence terlebih dahulu. Model generatif hanya menyusun analisis atau draft berdasarkan structured context.

Output AI wajib memiliki:

- evidence;
- assumptions;
- confidence;
- risks;
- proposed actions.

## Deployment path

1. Local development
2. Preview deployment per pull request
3. Production deployment
4. Separate Supabase environments for development and production

## Quality gates

- lint passes;
- strict typecheck passes;
- unit tests for domain calculations;
- build passes;
- RLS isolation tests pass;
- critical UAT flows pass.
