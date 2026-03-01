-- supabase/migrations/create_simulators_schema.sql
-- ================================================
-- SIMULADORES (FIRE, Aposentadoria, Investimentos)
-- Salvar configurações do usuário para persistência
-- ================================================

CREATE TABLE IF NOT EXISTS simulator_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  simulator_type TEXT NOT NULL CHECK (simulator_type IN (
    'fire', 'retirement', 'investment', 'tax_planning'
  )),
  config JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  is_favorite BOOLEAN DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sim_configs_user ON simulator_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_configs_type ON simulator_configs(simulator_type);

-- RLS
ALTER TABLE simulator_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own simulator configs" ON simulator_configs
  FOR ALL USING (auth.uid() = user_id);
