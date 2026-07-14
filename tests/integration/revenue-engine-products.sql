BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  engine_a uuid := gen_random_uuid();
  engine_b uuid := gen_random_uuid();
  linked_product uuid := gen_random_uuid();
  deleted_product uuid := gen_random_uuid();
  foreign_product uuid := gen_random_uuid();
  linked_count integer;
  launched_count integer;
BEGIN
  INSERT INTO app_users (id, email, display_name)
  VALUES
    (user_a, 'engine-products-a@example.com', 'Engine Products A'),
    (user_b, 'engine-products-b@example.com', 'Engine Products B');

  INSERT INTO revenue_engines (id, user_id, name, income_type)
  VALUES
    (engine_a, user_a, 'Owned Engine', 'product'),
    (engine_b, user_b, 'Foreign Engine', 'product');

  INSERT INTO products (
    id, user_id, revenue_engine_id, name, product_type, status, price, deleted_at
  ) VALUES
    (linked_product, user_a, engine_a, 'Linked Launch', 'digital', 'launched', 250000, NULL),
    (deleted_product, user_a, engine_a, 'Deleted Product', 'digital', 'building', 100000, now()),
    (foreign_product, user_b, engine_a, 'Foreign User Product', 'service', 'launched', 500000, NULL);

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'launched')
  INTO linked_count, launched_count
  FROM products
  WHERE revenue_engine_id = engine_a
    AND user_id = user_a
    AND deleted_at IS NULL;

  IF linked_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one visible linked product, got %', linked_count;
  END IF;

  IF launched_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one launched linked product, got %', launched_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM products
    WHERE id = foreign_product
      AND revenue_engine_id = engine_a
      AND user_id = user_a
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Foreign-user product leaked into owned revenue engine portfolio';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM products
    WHERE id = deleted_product
      AND revenue_engine_id = engine_a
      AND user_id = user_a
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Soft-deleted product leaked into revenue engine portfolio';
  END IF;
END $$;

ROLLBACK;
