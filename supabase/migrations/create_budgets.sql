-- supabase/migrations/create_budgets.sql

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,           -- valor de limite mensal (substituindo o antigo limit float)
  period TEXT NOT NULL DEFAULT 'monthly',       -- 'monthly', 'weekly', 'yearly'
  spent NUMERIC NOT NULL DEFAULT 0,            -- gasto atual (opcional, calculamos dinamicamente)
  color TEXT DEFAULT '#a855f7',                -- cor da categoria
  icon TEXT DEFAULT 'receipt',                 -- ícone da categoria
  active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_user_crud" ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON public.budgets(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(user_id, period);
