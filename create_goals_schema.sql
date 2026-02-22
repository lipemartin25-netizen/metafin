-- supabase/migrations/create_goals_schema.sql

CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,                      -- "Viagem Europa"
  icon TEXT DEFAULT '🎯',                  -- emoji
  color TEXT DEFAULT '#10b981',            -- HEX color
  target_amount DECIMAL(14,2) NOT NULL,    -- R$ 25.000
  current_amount DECIMAL(14,2) DEFAULT 0,  -- R$ 8.500
  monthly_contribution DECIMAL(12,2),      -- R$ 1.500
  target_date DATE,                        -- 2027-06-01
  category TEXT CHECK (category IN (
    'travel', 'car', 'house', 'wedding', 'education',
    'emergency_fund', 'retirement', 'investment', 'other'
  )),
  priority INTEGER DEFAULT 1,             -- 1=alta, 2=média, 3=baixa
  annual_return DECIMAL(5,4) DEFAULT 0.10, -- rentabilidade estimada
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'paused', 'cancelled'
  )),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de aportes por objetivo
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  source TEXT,  -- 'manual', 'automatic', 'pluggy'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- View: progresso de cada objetivo
CREATE VIEW goal_progress AS
SELECT 
  g.*,
  ROUND((g.current_amount / g.target_amount) * 100, 1) AS pct_complete,
  g.target_amount - g.current_amount AS remaining,
  CASE 
    WHEN g.monthly_contribution > 0 THEN
      CEIL((g.target_amount - g.current_amount) / g.monthly_contribution)
    ELSE NULL
  END AS months_remaining,
  CASE 
    WHEN g.target_date IS NOT NULL THEN
      g.target_date - CURRENT_DATE
    ELSE NULL  
  END AS days_until_target
FROM financial_goals g;

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own goals" ON financial_goals
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own contributions" ON goal_contributions
  FOR ALL USING (auth.uid() = user_id);
