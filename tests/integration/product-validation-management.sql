BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('00000000-0000-0000-0000-000000000401', 'validation-a@example.com', 'Validation A'),
  ('00000000-0000-0000-0000-000000000402', 'validation-b@example.com', 'Validation B');

INSERT INTO products (id, user_id, name, product_type)
VALUES ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000401', 'Validation Product', 'digital');

INSERT INTO product_validations (id, product_id, user_id, hypothesis, validation_method, result, validated_on)
VALUES ('00000000-0000-0000-0000-000000000421', '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000401', 'Initial hypothesis', 'Interview', 'inconclusive', '2026-07-14');

UPDATE product_validations
SET result = 'positive', notes = 'Customer committed to preorder', updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000421'
  AND product_id = '00000000-0000-0000-0000-000000000411'
  AND user_id = '00000000-0000-0000-0000-000000000401'
  AND deleted_at IS NULL;

DO $$
BEGIN
  IF (SELECT result FROM product_validations WHERE id = '00000000-0000-0000-0000-000000000421') <> 'positive' THEN
    RAISE EXCEPTION 'Owner update failed';
  END IF;
END $$;

UPDATE product_validations
SET result = 'negative'
WHERE id = '00000000-0000-0000-0000-000000000421'
  AND user_id = '00000000-0000-0000-0000-000000000402';

DO $$
BEGIN
  IF (SELECT result FROM product_validations WHERE id = '00000000-0000-0000-0000-000000000421') <> 'positive' THEN
    RAISE EXCEPTION 'Cross-user update was not blocked';
  END IF;
END $$;

UPDATE product_validations
SET deleted_at = now(), updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000421'
  AND user_id = '00000000-0000-0000-0000-000000000401'
  AND deleted_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM product_validations WHERE id = '00000000-0000-0000-0000-000000000421' AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Soft-deleted validation remains visible';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_validations WHERE id = '00000000-0000-0000-0000-000000000421') THEN
    RAISE EXCEPTION 'Soft delete physically removed row';
  END IF;
END $$;

ROLLBACK;
