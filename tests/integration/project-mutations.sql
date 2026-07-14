BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'mutation-a@example.com', 'Mutation A'),
  ('10000000-0000-0000-0000-000000000002', 'mutation-b@example.com', 'Mutation B');

INSERT INTO projects (
  id,
  user_id,
  name,
  project_type,
  status,
  priority,
  estimated_hours,
  revenue_potential
)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Owned by A',
    'product',
    'idea',
    'medium',
    0,
    0
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Owned by B',
    'service',
    'cancelled',
    'medium',
    0,
    0
  );

DO $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE projects
  SET name = 'Illegal cross-user mutation'
  WHERE id = '20000000-0000-0000-0000-000000000002'
    AND user_id = '10000000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 0 THEN
    RAISE EXCEPTION 'Cross-user update unexpectedly changed % row(s)', affected_rows;
  END IF;
END $$;

DO $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE projects
  SET name = 'Valid owner mutation'
  WHERE id = '20000000-0000-0000-0000-000000000001'
    AND user_id = '10000000-0000-0000-0000-000000000001'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Owner update expected 1 row, changed % row(s)', affected_rows;
  END IF;
END $$;

DO $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE projects
  SET deleted_at = now()
  WHERE id = '20000000-0000-0000-0000-000000000002'
    AND user_id = '10000000-0000-0000-0000-000000000002'
    AND status IN ('cancelled', 'archived')
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  IF affected_rows <> 1 THEN
    RAISE EXCEPTION 'Eligible soft delete expected 1 row, changed % row(s)', affected_rows;
  END IF;
END $$;

DO $$
DECLARE
  visible_rows integer;
BEGIN
  SELECT count(*) INTO visible_rows
  FROM projects
  WHERE user_id = '10000000-0000-0000-0000-000000000002'
    AND deleted_at IS NULL;

  IF visible_rows <> 0 THEN
    RAISE EXCEPTION 'Soft-deleted project remains visible';
  END IF;
END $$;

ROLLBACK;
