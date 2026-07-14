CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id),
  revenue_engine_id uuid REFERENCES revenue_engines(id),
  name text NOT NULL,
  description text,
  product_type text NOT NULL,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','validating','validated','building','launched','paused','retired')),
  price numeric(18,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  target_customer text,
  problem_statement text,
  launched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_users(id),
  hypothesis text NOT NULL,
  validation_method text NOT NULL,
  result text NOT NULL CHECK (result IN ('positive','negative','inconclusive')),
  evidence_url text,
  notes text,
  validated_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_user_engine_status_idx
  ON products (user_id, revenue_engine_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS product_validations_product_date_idx
  ON product_validations (product_id, validated_on DESC);