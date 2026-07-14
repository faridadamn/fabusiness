BEGIN;

INSERT INTO app_users (id, email, display_name) VALUES
('11111111-1111-1111-1111-111111111111', 'score-a@example.com', 'Score A'),
('22222222-2222-2222-2222-222222222222', 'score-b@example.com', 'Score B');

INSERT INTO projects (id, user_id, name, project_type, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Owned Project', 'product', 'idea');

INSERT INTO project_scores (
  project_id, user_id, revenue_potential, speed_to_revenue, market_demand,
  skill_fit, ease_of_validation, probability_of_completion,
  recurring_income_potential, strategic_fit, asset_creation_potential,
  complexity, risk_score, total_score, recommendation
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
  9, 8, 9, 8, 8, 8, 8, 9, 8, 3, 3, 72.50, 'prioritize'
);

DO $$
BEGIN
  IF (SELECT count(*) FROM project_scores WHERE project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND user_id = '11111111-1111-1111-1111-111111111111') <> 1 THEN
    RAISE EXCEPTION 'Owner score history missing';
  END IF;

  IF (SELECT count(*) FROM project_scores WHERE project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND user_id = '22222222-2222-2222-2222-222222222222') <> 0 THEN
    RAISE EXCEPTION 'Cross-user score exposure detected';
  END IF;
END $$;

ROLLBACK;
