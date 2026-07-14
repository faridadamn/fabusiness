CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  currency_code text NOT NULL DEFAULT 'IDR',
  daily_capacity_minutes integer NOT NULL DEFAULT 240 CHECK (daily_capacity_minutes BETWEEN 30 AND 1440),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  parent_goal_id uuid REFERENCES goals(id),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  period_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_value numeric(18,2),
  current_value numeric(18,2) NOT NULL DEFAULT 0,
  unit text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  success_criteria text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS revenue_engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  name text NOT NULL,
  description text,
  income_type text NOT NULL,
  monthly_target numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'idea',
  is_recurring boolean NOT NULL DEFAULT false,
  average_ticket_size numeric(18,2) NOT NULL DEFAULT 0,
  target_customer text,
  start_date date,
  review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  goal_id uuid REFERENCES goals(id),
  revenue_engine_id uuid REFERENCES revenue_engines(id),
  name text NOT NULL,
  description text,
  project_type text NOT NULL,
  status text NOT NULL DEFAULT 'idea',
  priority text NOT NULL DEFAULT 'medium',
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  estimated_hours numeric(10,2) NOT NULL DEFAULT 0,
  actual_hours numeric(10,2) NOT NULL DEFAULT 0,
  revenue_potential numeric(18,2) NOT NULL DEFAULT 0,
  actual_revenue numeric(18,2) NOT NULL DEFAULT 0,
  success_criteria text,
  stop_criteria text,
  health_status text NOT NULL DEFAULT 'healthy',
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS project_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id),
  revenue_potential smallint NOT NULL,
  speed_to_revenue smallint NOT NULL,
  market_demand smallint NOT NULL,
  skill_fit smallint NOT NULL,
  ease_of_validation smallint NOT NULL,
  probability_of_completion smallint NOT NULL,
  recurring_income_potential smallint NOT NULL,
  strategic_fit smallint NOT NULL,
  asset_creation_potential smallint NOT NULL,
  complexity smallint NOT NULL,
  risk_score smallint NOT NULL,
  total_score numeric(6,2) NOT NULL,
  recommendation text NOT NULL,
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  project_id uuid REFERENCES projects(id),
  goal_id uuid REFERENCES goals(id),
  revenue_engine_id uuid REFERENCES revenue_engines(id),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'inbox',
  priority text NOT NULL DEFAULT 'medium',
  start_date date,
  due_date date,
  estimated_minutes integer NOT NULL DEFAULT 0,
  actual_minutes integer NOT NULL DEFAULT 0,
  revenue_impact smallint NOT NULL DEFAULT 0,
  strategic_impact smallint NOT NULL DEFAULT 0,
  urgency smallint NOT NULL DEFAULT 0,
  priority_score numeric(8,2),
  is_daily_priority boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS task_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id),
  name text NOT NULL,
  description text,
  output_type text,
  priority text NOT NULL DEFAULT 'medium',
  weight integer NOT NULL DEFAULT 20,
  is_mandatory boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  evidence_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  task_id uuid REFERENCES tasks(id),
  project_id uuid REFERENCES projects(id),
  revenue_engine_id uuid REFERENCES revenue_engines(id),
  entry_date date NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer NOT NULL CHECK (duration_minutes >= 0),
  activity_category text NOT NULL,
  is_billable boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES app_users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals(user_id);
CREATE INDEX IF NOT EXISTS revenue_engines_user_id_idx ON revenue_engines(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_status_idx ON projects(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS project_scores_project_id_idx ON project_scores(project_id);
CREATE INDEX IF NOT EXISTS tasks_user_id_status_due_date_idx ON tasks(user_id, status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS task_outputs_user_id_task_id_idx ON task_outputs(user_id, task_id);
CREATE INDEX IF NOT EXISTS time_entries_user_id_entry_date_idx ON time_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_created_at_idx ON audit_logs(user_id, created_at DESC);