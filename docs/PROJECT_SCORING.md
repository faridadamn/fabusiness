# Project Scoring

Each project is scored from 1 to 10 across eleven factors.

Positive factors: revenue potential, speed to revenue, market demand, skill fit, validation ease, completion probability, recurring income potential, strategic fit, and asset creation potential.

Penalty factors: complexity and risk.

The engine produces a normalized score from 0 to 100 and one recommendation:

- `prioritize`: score >= 72
- `validate`: score >= 55
- `defer`: score >= 38
- `stop`: score < 38

Every scoring submission creates a new immutable history record in `project_scores`. It does not overwrite earlier assessments. An optional decision note can explain why the owner chooses a different action from the recommendation.

All reads and writes require both `project_id` and the authenticated `user_id`. Cross-user score access must return no records.

Source of truth:

- Domain formula: `src/domain/projects/scoring.ts`
- Unit tests: `src/domain/projects/scoring.test.ts`
- Repository: `src/server/repositories/project-scores.ts`
- PostgreSQL verification: `tests/integration/project-scoring.sql`
