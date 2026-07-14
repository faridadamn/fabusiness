BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES ('00000000-0000-0000-0000-000000000401', 'override@example.com', 'Override User');

INSERT INTO projects (id, user_id, name, project_type, status, priority)
VALUES
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000401', 'Main A', 'product', 'active', 'high'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000401', 'Main B', 'client', 'active', 'high'),
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000401', 'Main C', 'content', 'active', 'high'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000401', 'Override Candidate', 'product', 'idea', 'critical');

DO $$
DECLARE
  active_count integer;
BEGIN
  SELECT count(*) INTO active_count
  FROM projects
  WHERE user_id = '00000000-0000-0000-0000-000000000401'
    AND status = 'active'
    AND deleted_at IS NULL
    AND lower(trim(project_type)) <> 'experiment';

  IF active_count <> 3 THEN
    RAISE EXCEPTION 'Expected three active main projects before override, got %', active_count;
  END IF;
END $$;

UPDATE projects
SET status = 'active', updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000414'
  AND user_id = '00000000-0000-0000-0000-000000000401'
  AND deleted_at IS NULL;

INSERT INTO audit_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values
)
VALUES (
  '00000000-0000-0000-0000-000000000401',
  'project.capacity_override',
  'project',
  '00000000-0000-0000-0000-000000000414',
  '{"status":"idea","activeCount":3,"limit":3,"bucket":"main"}'::jsonb,
  '{"status":"active","overrideReason":"Signed client deadline requires temporary additional focus."}'::jsonb
);

DO $$
DECLARE
  audit_count integer;
BEGIN
  SELECT count(*) INTO audit_count
  FROM audit_logs
  WHERE user_id = '00000000-0000-0000-0000-000000000401'
    AND action = 'project.capacity_override'
    AND entity_id = '00000000-0000-0000-0000-000000000414'
    AND new_values->>'overrideReason' IS NOT NULL;

  IF audit_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one capacity override audit event, got %', audit_count;
  END IF;
END $$;

ROLLBACK;
