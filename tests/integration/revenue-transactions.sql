BEGIN;

DO $$
DECLARE
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  engine_a uuid := gen_random_uuid();
  engine_b uuid := gen_random_uuid();
  visible_count integer;
  income_total numeric;
  expense_total numeric;
BEGIN
  INSERT INTO app_users (id, email, display_name)
  VALUES
    (user_a, 'ledger-a@example.com', 'Ledger A'),
    (user_b, 'ledger-b@example.com', 'Ledger B');

  INSERT INTO revenue_engines (id, user_id, name, income_type)
  VALUES
    (engine_a, user_a, 'Engine A', 'service'),
    (engine_b, user_b, 'Engine B', 'service');

  INSERT INTO revenue_transactions
    (user_id, revenue_engine_id, transaction_type, amount, occurred_on, description)
  VALUES
    (user_a, engine_a, 'income', 5000000, current_date, 'Client payment'),
    (user_a, engine_a, 'expense', 750000, current_date, 'Software cost'),
    (user_b, engine_b, 'income', 9000000, current_date, 'Other user income');

  SELECT count(*) INTO visible_count
  FROM revenue_transactions
  WHERE user_id = user_a AND revenue_engine_id = engine_b AND deleted_at IS NULL;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'User A can see User B revenue transactions';
  END IF;

  SELECT
    coalesce(sum(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0),
    coalesce(sum(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)
  INTO income_total, expense_total
  FROM revenue_transactions
  WHERE user_id = user_a AND revenue_engine_id = engine_a AND deleted_at IS NULL;

  IF income_total <> 5000000 OR expense_total <> 750000 THEN
    RAISE EXCEPTION 'Revenue ledger aggregation is incorrect';
  END IF;
END $$;

ROLLBACK;
