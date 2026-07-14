# Revenue Engine Management

Revenue engines represent repeatable or testable paths to income. They are separate from projects: a project is finite work, while an engine represents the economic mechanism that may own multiple projects and time entries.

## Lifecycle

- `idea`: an unvalidated income path.
- `validating`: evidence is being collected before committing capacity.
- `active`: the engine is currently expected to contribute revenue.
- `paused`: temporarily inactive but may resume.
- `stopped`: terminal history; it is not silently deleted.

Lifecycle rules are defined in `src/domain/revenue-engines/lifecycle.ts` and covered by unit tests.

## Current economics

The first vertical slice records:

- monthly target;
- average ticket size;
- recurring income flag;
- income type;
- target customer;
- start and review dates.

Actual revenue, expenses, conversion, linked products and revenue-per-hour are intentionally implemented by later backlog tasks.

## Security

All reads and mutations require the authenticated internal user UUID and filter by `revenue_engines.user_id`. Normal reads exclude soft-deleted rows. Cross-user reads and mutations are verified by `tests/integration/revenue-engines.sql`.
