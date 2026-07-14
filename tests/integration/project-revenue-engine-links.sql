BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  engine_a uuid := gen_random_uuid();
  engine_b uuid := gen_random_uuid();
  project_a uuid := gen_random_uuid();
  changed_rows integer;
BEGIN
  INSERT INTO app_users (id, email, display_name)
  VALUES
    (user_a, 'project-link-a@example.test', 'Project Link A'),
    (user_b, 'project-link-b@example.test', 'Project Link B');

  INSERT INTO revenue_engines (
    id, user_id, name, income_type, monthly_target, status,
    is_recurring, average_ticket_size
  ) VALUES
    (engine_a, user_a, 'Engine A', 'service', 10000000, 'active', false, 5000000),
    (engine_b, user_b, 'Engine B', 'service', 10000000, 'active', false, 5000000);

  INSERT INTO projects (
    id, user_id, name, project_type, status, priority,
    estimated_hours, actual_hours, revenue_potential, actual_revenue
  ) VALUES (
    project_a, user_a, 'Project A', 'business', 'idea', 'high',
    20, 0, 15000000, 0
  );

  UPDATE projects p
  SET revenue_engine_id = engine_a
  WHERE p.id = project_a
    AND p.user_id = user_a
    AND EXISTS (
      SELECT 1
      FROM revenue_engines re
      WHERE re.id = engine_a
        AND re.user_id = user_a
        AND re.deleted_at IS NULL
    );

  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'Expected owned revenue engine assignment to update one project';
  END IF;

  UPDATE projects p
  SET revenue_engine_id = engine_b
  WHERE p.id = project_a
    AND p.user_id = user_a
    AND EXISTS (
      SELECT 1
      FROM revenue_engines re
      WHERE re.id = engine_b
        AND re.user_id = user_a
        AND re.deleted_at IS NULL
    );

  GET DIAGNOSTICS changed_rows = ROW_COUNT;
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'Cross-user revenue engine assignment must affect zero projects';
  END IF;

  IF (SELECT revenue_engine_id FROM projects WHERE id = project_a) <> engine_a THEN
    RAISE EXCEPTION 'Rejected cross-user assignment must preserve the owned engine link';
  END IF;

  IF (
    SELECT count(*)
    FROM projects p
    JOIN revenue_engines re ON re.id = p.revenue_engine_id
    WHERE p.user_id = user_a
      AND re.user_id <> user_a
  ) <> 0 THEN
    RAISE EXCEPTION 'Project portfolio contains a cross-user revenue engine link';
  END IF;
END $$;

ROLLBACK;
