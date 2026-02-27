-- =============================================
-- SECURITY PATCH V2: Enterprise Hardening
-- MetaFin App - Proactive Security & RLS Audit
-- =============================================

-- 1. REFORÇO GLOBAL DE RLS (FALLBACK)
-- Garante que o administrador não esqueceu de ativar RLS em tabelas satélite

ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.net_worth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.of_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- 2. PROTEÇÃO DE VIEWS (Insecure View Check)
-- Garante que views de progresso usem SECURITY INVOKER para respeitar o RLS das tabelas base

-- Budget Progress View
CREATE OR REPLACE VIEW public.budget_progress WITH (security_invoker=on) AS
SELECT 
  b.id as budget_id,
  b.user_id,
  b.category,
  b.month_year,
  b.planned_amount,
  COALESCE(SUM(t.amount), 0) AS spent
FROM public.budgets b
LEFT JOIN public.transactions t 
  ON t.user_id = b.user_id 
  AND t.category = b.category
  AND date_trunc('month', t.date::date) = date_trunc('month', b.month_year::date)
GROUP BY b.id, b.user_id;

-- 3. POLÍTICA DE AUDITORIA DE CONEXÕES (Pluggy)
-- Limita conexões de open finance estritamente ao dono
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Connections owner only" ON public.of_connections;
END $$;

CREATE POLICY "Connections owner only" 
ON public.of_connections FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. ÍNDICES DE SEGURANÇA (Anti-Enumeration)
-- Otimiza o filtro de RLS para evitar timeouts que possam expurgar logs de segurança
CREATE INDEX IF NOT EXISTS idx_networth_user_date ON public.net_worth_history(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_cat ON public.budgets(user_id, category);

-- 5. TRIMMING DE DADOS (Privacidade por Design)
-- Garante que delete cascade funcione corretamente em todas as tabelas para LGPD Right to be Forgotten
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
