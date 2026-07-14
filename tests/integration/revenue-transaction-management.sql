BEGIN;

INSERT INTO app_users (id, email, display_name)
VALUES
  ('00000000-0000-4000-8000-000000000071', 'ledger-a@example.com', 'Ledger A'),
  ('00000000-0000-4000-8000-000000000072', 'ledger-b@example.com', 'Ledger B');

INSERT INTO revenue_engines (id, user_id, name, income_type)
VALUES
  ('10000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000071', 'Engine A', 'service'),
  ('10000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000072', 'Engine B', 'service');

INSERT INTO revenue_transactions (
  id, user_id, revenue_engine_id, transaction_type, amount, occurred_on, description
)
VALUES
  ('20000000-0000-4000-8000-000000000071', '00000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'income', 1000000, '2026-06-30', 'June income'),
  ('20000000-0000-4000-8000-000000000072', '00000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'income', 2500000, '2026-07-05', 'July income'),
  ('20000000-0000-4000-8000-000000000073', '00000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'expense', 500000, '2026-07-06', 'July expense'),
  ('20000000-0000-4000-8000-000000000074', '00000000-0000-4000-8000-000000000072', '10000000-0000-4000-8000-000000000072', 'income', 9000000, '2026-07-07', 'User B income');

DO $$
DECLARE
  july_income numeric;
  july_expense numeric;
  affected integer;
  visible_count integer;
  physical_count integer;
BEGIN
  SELECT
    coalesce(sum(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0),
    coalesce(sum(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)
  INTO july_income, july_expense
  FROM revenue_transactions
  WHERE user_id = '00000000-0000-4000-8000-000000000071'
    AND revenue_engine_id = '10000000-0000-4000-8000-000000000071'
    AND occurred_on BETWEEN '2026-07-01' AND '2026-07-31'
    AND deleted_at IS NULL;

  IF july_income <> 2500000 OR july_expense <> 500000 THEN
    RAISE EXCEPTION 'Period filter aggregation failed: income %, expense %', july_income, july_expense;
  END IF;

  UPDATE revenue_transactions
  SET description = 'Illegal cross-user edit'
  WHERE id = '20000000-0000-4000-8000-000000000074'
    AND user_id = '00000000-0000-4000-8000-000000000071'
    AND revenue_engine_id = '10000000-0000-4000-8000-000000000071'
    AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected <> 0 THEN
    RAISE EXCEPTION 'Cross-user transaction edit unexpectedly succeeded';
  END IF;

  UPDATE revenue_transactions
  SET deleted_at = now(), updated_at = now()
  WHERE id = '20000000-0000-4000-8000-000000000073'
    AND user_id = '00000000-0000-4000-8000-000000000071'
    AND revenue_engine_id = '10000000-0000-4000-8000-000000000071'
    AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected <> 1 THEN
    RAISE EXCEPTION 'Owned soft delete did not affect exactly one row';
  END IF;

  SELECT count(*) INTO visible_count
  FROM revenue_transactions
  WHERE id = '20000000-0000-4000-8000-000000000073'
    AND deleted_at IS NULL;

  SELECT count(*) INTO physical_count
  FROM revenue_transactions
  WHERE id = '20000000-0000-4000-8000-000000000073';

  IF visible_count <> 0 OR physical_count <> 1 THEN
    RAISE EXCEPTION 'Soft delete visibility failed: visible %, physical %', visible_count, physical_count;
  END IF;
END $$;

ROLLBACK;
