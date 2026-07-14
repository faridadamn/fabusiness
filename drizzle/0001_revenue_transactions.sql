CREATE TABLE IF NOT EXISTS revenue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  revenue_engine_id uuid NOT NULL REFERENCES revenue_engines(id),
  project_id uuid REFERENCES projects(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  occurred_on date NOT NULL,
  description text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS revenue_transactions_user_engine_date_idx
  ON revenue_transactions (user_id, revenue_engine_id, occurred_on DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS revenue_transactions_project_idx
  ON revenue_transactions (project_id)
  WHERE deleted_at IS NULL;
