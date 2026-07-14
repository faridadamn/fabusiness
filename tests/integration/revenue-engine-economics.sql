BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  engine_a uuid := gen_random_uuid();
  engine_b uuid := gen_random_uuid();
  linked_count integer;
  active_count integer;
  total_potential numeric;
  total_actual numeric;
  total_estimated_hours numeric;
  total_actual_hours numeric;
BEGIN
  INSERT INTO app_users (id, email, display_name)
  VALUES
    (user_a, 'economics-a@example.com', 'Economics A'),
    (user_b, 'economics-b@example.com', 'Economics B');

  INSERT INTO revenue_engines (
    id, user_id, name, income_type, monthly_target, average_ticket_size, status
  ) VALUES
    (engine_a, user_a, 'Engine A', 'service', 10000000, 5000000, 'active'),
    (engine_b, user_b, 'Engine B', 'service', 20000000, 10000000, 'active');

  INSERT INTO projects (
    user_id, revenue_engine_id, name, project_type, status, priority,
    estimated_hours, actual_hours, revenue_potential, actual_revenue, deleted_at
  ) VALUES
    (user_a, engine_a, 'A Active', 'client', 'active', 'high', 20, 10, 5000000, 2000000, NULL),
    (user_a, engine_a, 'A Completed', 'client', 'completed', 'medium', 10, 8, 3000000, 3000000, NULL),
    (user_b, engine_b, 'B Foreign', 'client', 'active', 'high', 100, 50, 999000000, 999000000, NULL),
    (user_a, engine_a, 'A Deleted', 'client', 'active', 'low', 99, 99, 99000000, 99000000, now());

  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'active'),
    coalesce(sum(revenue_potential), 0),
    coalesce(sum(actual_revenue), 0),
    coalesce(sum(estimated_hours), 0),
    coalesce(sum(actual_hours), 0)
  INTO
    linked_count,
    active_count,
    total_potential,
    total_actual,
    total_estimated_hours,
    total_actual_hours
  FROM projects
  WHERE revenue_engine_id = engine_a
    AND user_id = user_a
    AND deleted_at IS NULL;

  IF linked_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 linked projects, got %', linked_count;
  END IF;

  IF active_count <> 1 THEN
    RAISE EXCEPTION 'Expected 1 active linked project, got %', active_count;
  END IF;

  IF total_potential <> 8000000 THEN
    RAISE EXCEPTION 'Unexpected revenue potential total: %', total_potential;
  END IF;

  IF total_actual <> 5000000 THEN
    RAISE EXCEPTION 'Unexpected actual revenue total: %', total_actual;
  END IF;

  IF total_estimated_hours <> 30 THEN
    RAISE EXCEPTION 'Unexpected estimated hours total: %', total_estimated_hours;
  END IF;

  IF total_actual_hours <> 18 THEN
    RAISE EXCEPTION 'Unexpected actual hours total: %', total_actual_hours;
  END IF;
END $$;

ROLLBACK;
