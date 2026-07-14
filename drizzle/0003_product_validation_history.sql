ALTER TABLE product_validations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS product_validations_active_product_date_idx
  ON product_validations (product_id, validated_on DESC)
  WHERE deleted_at IS NULL;
