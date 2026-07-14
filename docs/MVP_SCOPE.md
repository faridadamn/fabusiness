# MVP Scope and Domain Boundaries

## Product objective

FA Business OS membantu satu pengguna menentukan prioritas, mengelola eksekusi, dan menghubungkan waktu kerja dengan hasil bisnis serta pendapatan.

## MVP outcome

Pengguna dapat menjawab lima pertanyaan dari satu sistem:

1. Apa tiga pekerjaan terpenting hari ini?
2. Project mana yang sehat, berisiko, atau harus dihentikan?
3. Revenue engine mana yang paling efektif?
4. Berapa waktu yang digunakan dan revenue per hour yang dihasilkan?
5. Apa keputusan utama untuk minggu berikutnya?

## Must-have domains

### Identity
- Authentication
- User profile
- Timezone, currency, capacity, and working preferences

### Strategy
- Goals and measurable targets
- Revenue engines
- Project scoring and active-project limits

### Execution
- Projects and lifecycle
- Tasks, outputs, dependencies, blockers, recurrence
- Top-three daily priorities
- Time tracking

### Commercial
- Products and validation
- Contacts, leads, opportunities, activities
- Operational income and expense

### Growth
- Content pipeline
- Product and CTA linkage
- Basic content metrics

### Intelligence
- Knowledge vault
- Decision log
- Daily and weekly reviews
- Rule-based recommendations before generative AI

## Explicitly out of scope for MVP

- Full accounting and tax compliance
- Payroll and HR
- Inventory
- Marketplace
- Native mobile application
- Multi-company
- Public multi-tenant SaaS billing
- Autonomous financial actions
- Fully automated social publishing
- Complex no-code workflow builder

## Domain ownership rules

- Every user-owned business record contains `owner_id`.
- A goal may own targets and link to projects.
- A revenue engine owns commercial aggregation but does not replace accounting.
- A project owns execution scope; tasks cannot exist outside an owner and may optionally belong to a project.
- Products represent an offer; content and CRM records may link to products.
- Income and expense are operational records and may link to revenue engine, project, product, and customer.
- AI recommendations are derived artifacts and never become source-of-truth records.

## Active work limits

Default limits:

- 3 active main projects
- 2 active experiments
- operational recurring work is excluded from the main-project limit

Overrides require a written reason and audit entry.

## MVP completion criteria

The MVP is considered usable when the user can:

- authenticate securely;
- create goals, revenue engines, projects, tasks, and outputs;
- receive and select three daily priorities;
- track time and operational finance;
- manage a basic product and lead pipeline;
- complete a weekly CEO review;
- view a command center with current risks and opportunities;
- use the application effectively on mobile and desktop.

## Delivery principle

Each phase must produce a usable vertical slice. A feature is not complete until validation, authorization, responsive UI, error handling, and acceptance tests exist.
