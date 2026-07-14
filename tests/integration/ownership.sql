BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'user-a@example.test', 'User A'),
  ('00000000-0000-4000-8000-000000000002', 'user-b@example.test', 'User B');

INSERT INTO projects (
  id,
  user_id,
  name,
  project_type,
  status,
  priority,
  estimated_hours,
  actual_hours,
  revenue_potential,
  actual_revenue,
  health_status
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Project owned by User A',
    'validation',
    'active',
    'high',
    8,
    0,
    1000000,
    0,
    'healthy'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'Project owned by User B',
    'validation',
    'active',
    'medium',
    4,
    0,
    500000,
    0,
    'healthy'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'Soft-deleted project owned by User A',
    'validation',
    'stopped',
    'low',
    2,
    0,
    0,
    0,
    'at_risk'
  );

UPDATE projects
SET deleted_at = now()
WHERE id = '10000000-0000-4000-8000-000000000003';

DO $$
DECLARE
  user_a_visible_count integer;
  user_b_visible_count integer;
  cross_user_count integer;
  deleted_visible_count integer;
BEGIN
  SELECT count(*) INTO user_a_visible_count
  FROM projects
  WHERE user_id = '00000000-0000-4000-8000-000000000001'
    AND deleted_at IS NULL;

  SELECT count(*) INTO user_b_visible_count
  FROM projects
  WHERE user_id = '00000000-0000-4000-8000-000000000002'
    AND deleted_at IS NULL;

  SELECT count(*) INTO cross_user_count
  FROM projects
  WHERE id = '10000000-0000-4000-8000-000000000002'
    AND user_id = '00000000-0000-4000-8000-000000000001'
    AND deleted_at IS NULL;

  SELECT count(*) INTO deleted_visible_count
  FROM projects
  WHERE id = '10000000-0000-4000-8000-000000000003'
    AND user_id = '00000000-0000-4000-8000-000000000001'
    AND deleted_at IS NULL;

  IF user_a_visible_count <> 1 THEN
    RAISE EXCEPTION 'Expected User A to see exactly 1 active project, got %', user_a_visible_count;
  END IF;

  IF user_b_visible_count <> 1 THEN
    RAISE EXCEPTION 'Expected User B to see exactly 1 active project, got %', user_b_visible_count;
  END IF;

  IF cross_user_count <> 0 THEN
    RAISE EXCEPTION 'Cross-user project became visible';
  END IF;

  IF deleted_visible_count <> 0 THEN
    RAISE EXCEPTION 'Soft-deleted project became visible';
  END IF;
END
$$;

ROLLBACK;
