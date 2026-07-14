BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  main_active_count integer;
  experiment_active_count integer;
BEGIN
  INSERT INTO app_users (id, email, display_name)
  VALUES (user_a, 'capacity-a@example.com', 'Capacity A');

  INSERT INTO projects (user_id, name, project_type, status, priority)
  VALUES
    (user_a, 'Main 1', 'product', 'active', 'medium'),
    (user_a, 'Main 2', 'client', 'active', 'medium'),
    (user_a, 'Main 3', 'content', 'active', 'medium'),
    (user_a, 'Experiment 1', 'experiment', 'active', 'medium'),
    (user_a, 'Experiment 2', 'experiment', 'active', 'medium'),
    (user_a, 'Paused main', 'product', 'paused', 'medium'),
    (user_a, 'Deleted main', 'product', 'active', 'medium');

  UPDATE projects
  SET deleted_at = now()
  WHERE user_id = user_a AND name = 'Deleted main';

  SELECT count(*) INTO main_active_count
  FROM projects
  WHERE user_id = user_a
    AND status = 'active'
    AND deleted_at IS NULL
    AND lower(trim(project_type)) <> 'experiment';

  SELECT count(*) INTO experiment_active_count
  FROM projects
  WHERE user_id = user_a
    AND status = 'active'
    AND deleted_at IS NULL
    AND lower(trim(project_type)) = 'experiment';

  IF main_active_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 active main projects, got %', main_active_count;
  END IF;

  IF experiment_active_count <> 2 THEN
    RAISE EXCEPTION 'Expected 2 active experiments, got %', experiment_active_count;
  END IF;
END $$;

ROLLBACK;
