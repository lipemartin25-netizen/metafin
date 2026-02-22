-- Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  month_year DATE NOT NULL,
  planned_amount DECIMAL(12,2) NOT NULL,
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,
  rollover_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Um usuário só pode ter 1 meta por categoria por mês
  UNIQUE(user_id, category, month_year)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can manage their own budgets" 
ON public.budgets 
FOR ALL USING (auth.uid() = user_id);

-- View para calcular o progresso orçamentário em tempo real (Secure Invoker)
CREATE OR REPLACE VIEW public.budget_progress WITH (security_invoker=on) AS
SELECT 
  b.id as budget_id,
  b.user_id,
  b.category,
  b.month_year,
  b.planned_amount,
  b.alert_threshold,
  COALESCE(SUM(t.amount), 0) AS spent,
  b.planned_amount - COALESCE(SUM(t.amount), 0) AS remaining,
  CASE 
    WHEN b.planned_amount > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / b.planned_amount) * 100, 1)
    ELSE 0
  END AS pct_used
FROM public.budgets b
LEFT JOIN public.transactions t 
  ON t.user_id = b.user_id 
  AND t.category = b.category
  AND t.type = 'expense'
  AND t.status != 'pending'
  AND date_trunc('month', t.date::date) = date_trunc('month', b.month_year::date)
GROUP BY 
  b.id, b.user_id, b.category, b.month_year, b.planned_amount, b.alert_threshold;
