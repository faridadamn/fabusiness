# Continuous Integration

## Workflow

The repository uses `.github/workflows/ci.yml` for every push and pull request targeting `main`.

The workflow performs these gates in order:

1. Start an isolated PostgreSQL service container.
2. Install Node.js dependencies.
3. Apply `drizzle/0000_phase_zero_foundation.sql` to an empty database.
4. Run `tests/integration/ownership.sql` using two users and isolated project records.
5. Run TypeScript type checking.
6. Run ESLint.
7. Run unit tests.
8. Run the production build.

The database test does not use Neon credentials and never touches development or production data.

## Required repository setting

GitHub Actions must be enabled for this repository. In GitHub, open:

`Settings → Actions → General`

Under **Actions permissions**, allow GitHub Actions to run, then save the setting. The workflow should start automatically on the next commit to `main` or on a pull request.

## Completion rule

Phase 0 repository initialization and authorization isolation are not considered fully verified until the CI workflow has at least one successful run.
