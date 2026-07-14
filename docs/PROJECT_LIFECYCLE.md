# Project Lifecycle Rules

## Status lifecycle

Projects use these business statuses:

- `idea`
- `active`
- `paused`
- `completed`
- `cancelled`
- `archived`

Transitions are enforced by `src/domain/projects/lifecycle.ts`.

## Archive versus soft delete

`archived` is a business status. Archived projects remain available for historical reporting, audit context, and future analytics.

`deleted_at` is a technical soft-delete marker. Normal repository reads exclude rows where `deleted_at` is not null.

A project may only be soft-deleted after it is:

- `cancelled`, or
- `archived`.

Active, paused, idea, and completed projects cannot be directly deleted. They must first move through an allowed lifecycle transition.

## Ownership rules

Every read and mutation must include:

- the project ID;
- the authenticated internal user ID;
- `deleted_at IS NULL` for normal operations.

A mutation that does not match all three conditions must affect zero rows and must not reveal whether another user's project exists.

## Verification

Lifecycle rules are covered by:

- `src/domain/projects/lifecycle.test.ts`
- `tests/integration/project-mutations.sql`
- `tests/integration/ownership.sql`

The CI workflow applies the baseline PostgreSQL migration before running database integration checks.
