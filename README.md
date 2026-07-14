# FA Business OS

Personal Business Operating System untuk membantu Farid Adam mengelola fokus, project, revenue engine, task, content, product, CRM, knowledge, dan weekly CEO review dalam satu sistem.

## Current phase

**Phase 0 — Foundation**

Fokus fase ini:

- mengunci scope MVP dan batas domain;
- menyiapkan baseline Next.js + TypeScript;
- menyiapkan konfigurasi Supabase;
- merancang migrasi database dan Row Level Security;
- membangun design system serta application shell;
- menyiapkan standar kualitas kode dan dokumentasi teknis.

## Planned stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase PostgreSQL, Auth, Storage, dan RLS
- Vitest untuk unit test
- Playwright untuk end-to-end test

## Documentation

- `docs/MVP_SCOPE.md` — batas MVP dan keputusan domain
- `docs/ARCHITECTURE.md` — arsitektur teknis awal
- `docs/DATABASE_PLAN.md` — domain data dan urutan migrasi
- `.env.example` — daftar environment variable tanpa secret

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Security rules

- Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke kode client.
- Semua tabel milik user wajib menggunakan `owner_id` dan Row Level Security.
- Perubahan schema harus dibuat melalui migration yang dapat diulang.
- Data dihapus menggunakan soft delete kecuali ada kebutuhan administratif khusus.
