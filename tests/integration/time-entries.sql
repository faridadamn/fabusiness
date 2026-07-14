BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  project_a uuid := gen_random_uuid();
  project_b uuid := gen_random_uuid();
  engine_a uuid := gen_random_uuid();
  engine_b uuid := gen_random_uuid();
  task_a uuid := gen_random_uuid();
  task_b uuid := gen_random_uuid();
  entry_id uuid := gen_random_uuid();
  owned_link_count integer;
  total_minutes integer;
BEGIN
  INSERT INTO app_users (id, email, display_name) VALUES
    (user_a, 'time-a@example.com', 'Time A'),
    (user_b, 'time-b@example.com', 'Time B');

  INSERT INTO revenue_engines (id, user_id, name, income_type) VALUES
    (engine_a, user_a, 'Engine A', 'service'),
    (engine_b, user_b, 'Engine B', 'service');

  INSERT INTO projects (id, user_id, revenue_engine_id, name, project_type) VALUES
    (project_a, user_a, engine_a, 'Project A', 'client'),
    (project_b, user_b, engine_b, 'Project B', 'client');

  INSERT INTO tasks (id, user_id, project_id, revenue_engine_id, name) VALUES
    (task_a, user_a, project_a, engine_a, 'Task A'),
    (task_b, user_b, project_b, engine_b, 'Task B');

  SELECT count(*) INTO owned_link_count
  FROM tasks t
  JOIN projects p ON p.id = project_a AND p.user_id = user_a AND p.deleted_at IS NULL
  JOIN revenue_engines r ON r.id = engine_a AND r.user_id = user_a AND r.deleted_at IS NULL
  WHERE t.id = task_a AND t.user_id = user_a AND t.deleted_at IS NULL;

  IF owned_link_count <> 1 THEN RAISE EXCEPTION 'Expected owned links to resolve'; END IF;

  SELECT count(*) INTO owned_link_count
  FROM tasks t
  JOIN projects p ON p.id = project_b AND p.user_id = user_a AND p.deleted_at IS NULL
  WHERE t.id = task_a AND t.user_id = user_a AND t.deleted_at IS NULL;

  IF owned_link_count <> 0 THEN RAISE EXCEPTION 'Cross-user project link must not resolve'; END IF;

  INSERT INTO time_entries (id, user_id, task_id, project_id, revenue_engine_id, entry_date, duration_minutes, activity_category, is_billable)
  VALUES (entry_id, user_a, task_a, project_a, engine_a, current_date, 90, 'client_delivery', true);

  UPDATE tasks SET actual_minutes = actual_minutes + 90 WHERE id = task_a AND user_id = user_a AND deleted_at IS NULL;
  UPDATE projects SET actual_hours = actual_hours + 1.5 WHERE id = project_a AND user_id = user_a AND deleted_at IS NULL;

  IF (SELECT actual_minutes FROM tasks WHERE id = task_a) <> 90 THEN RAISE EXCEPTION 'Task actual minutes not aggregated'; END IF;
  IF (SELECT actual_hours FROM projects WHERE id = project_a) <> 1.5 THEN RAISE EXCEPTION 'Project actual hours not aggregated'; END IF;

  INSERT INTO time_entries (user_id, task_id, project_id, revenue_engine_id, entry_date, duration_minutes, activity_category)
  VALUES (user_b, task_b, project_b, engine_b, current_date, 999, 'administration');

  SELECT coalesce(sum(duration_minutes), 0) INTO total_minutes
  FROM time_entries WHERE user_id = user_a AND entry_date = current_date;

  IF total_minutes <> 90 THEN RAISE EXCEPTION 'User time summary leaked foreign entries: %', total_minutes; END IF;
END $$;

ROLLBACK;
