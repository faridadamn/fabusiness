BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('91000000-0000-0000-0000-000000000001', 'engine-a@example.com', 'Engine User A'),
  ('91000000-0000-0000-0000-000000000002', 'engine-b@example.com', 'Engine User B');

INSERT INTO revenue_engines (
  id, user_id, name, income_type, monthly_target, status,
  is_recurring, average_ticket_size
)
VALUES
  ('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'AI Implementation', 'service', 10000000, 'idea', false, 5000000),
  ('92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'Affiliate Content', 'affiliate', 5000000, 'active', true, 100000);

DO $$
DECLARE
  visible_count integer;
  updated_count integer;
BEGIN
  SELECT count(*) INTO visible_count
  FROM revenue_engines
  WHERE id = '92000000-0000-0000-0000-000000000002'
    AND user_id = '91000000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'User A can see User B revenue engine';
  END IF;

  UPDATE revenue_engines
  SET status = 'active', updated_at = now()
  WHERE id = '92000000-0000-0000-0000-000000000001'
    AND user_id = '91000000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'Owner could not update revenue engine';
  END IF;

  UPDATE revenue_engines
  SET status = 'stopped', updated_at = now()
  WHERE id = '92000000-0000-0000-0000-000000000002'
    AND user_id = '91000000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count <> 0 THEN
    RAISE EXCEPTION 'Cross-user revenue engine mutation succeeded';
  END IF;
END $$;

ROLLBACK;
