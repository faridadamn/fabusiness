BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'product-a@example.com', 'Product A'),
  ('10000000-0000-0000-0000-000000000002', 'product-b@example.com', 'Product B');

INSERT INTO revenue_engines (id, user_id, name, income_type)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Engine A', 'digital'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Engine B', 'service');

INSERT INTO products (id, user_id, revenue_engine_id, name, product_type, status)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Product A', 'course', 'validating'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Product B', 'service', 'idea');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM products
    WHERE id = '30000000-0000-0000-0000-000000000002'
      AND user_id = '10000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'Cross-user product read must be blocked';
  END IF;
END $$;

INSERT INTO product_validations (
  product_id, user_id, hypothesis, validation_method, result, validated_on
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Customers will preorder the course',
  'Preorder landing page',
  'positive',
  CURRENT_DATE
);

DO $$
DECLARE positive_count integer;
BEGIN
  SELECT count(*) INTO positive_count
  FROM product_validations
  WHERE product_id = '30000000-0000-0000-0000-000000000001'
    AND user_id = '10000000-0000-0000-0000-000000000001'
    AND result = 'positive';
  IF positive_count <> 1 THEN
    RAISE EXCEPTION 'Positive validation gate failed';
  END IF;
END $$;

UPDATE products
SET status = 'validated', updated_at = now()
WHERE id = '30000000-0000-0000-0000-000000000001'
  AND user_id = '10000000-0000-0000-0000-000000000001';

DO $$
DECLARE affected integer;
BEGIN
  UPDATE products SET status = 'building'
  WHERE id = '30000000-0000-0000-0000-000000000002'
    AND user_id = '10000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'Cross-user product mutation must affect zero rows';
  END IF;
END $$;

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'product.validation_override',
  'product',
  '30000000-0000-0000-0000-000000000001',
  '{"status":"validating"}',
  '{"status":"building","overrideReason":"Client preorder contract requires immediate delivery."}'
);

DO $$
BEGIN
  IF (SELECT count(*) FROM audit_logs WHERE action = 'product.validation_override' AND entity_id = '30000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'Validation override audit event missing';
  END IF;
END $$;

ROLLBACK;
