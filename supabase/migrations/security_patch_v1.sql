-- =============================================
-- SECURITY PATCH: Enforce RLS and Data Privacy
-- MetaFin App - Enterprise Grade Security
-- =============================================

-- 1. ESTRUTURA DE TRANSAÇÕES
-- Garante que a tabela tenha RLS e políticas de proteção de dados

-- Ativa RLS se ainda não estiver ativo
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions FORCE ROW LEVEL SECURITY;

-- Limpa políticas antigas para evitar conflitos
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;
    DROP POLICY IF EXISTS "Users can only access their own transactions" ON public.transactions;
END $$;

-- Cria políticas rigorosas baseadas em auth.uid()
CREATE POLICY "transactions_select_policy" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_policy" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_policy" 
ON public.transactions FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_policy" 
ON public.transactions FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- 2. PROTEÇÃO DE METAS (GOALS)
-- Reforça RLS na tabela de metas para evitar IDOR

ALTER TABLE IF EXISTS public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goal_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own goals" ON public.financial_goals;
CREATE POLICY "Users own goals" 
ON public.financial_goals FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own contributions" ON public.goal_contributions;
CREATE POLICY "Users own contributions" 
ON public.goal_contributions FOR ALL 
USING (auth.uid() = user_id);


-- 3. AUDITORIA BÁSICA
-- Adiciona coluna de IP e User-Agent se necessário futuramente
-- ALTER TABLE public.of_connections ADD COLUMN IF NOT EXISTS last_ip inet;


-- 4. ÍNDICES DE PERFORMANCE E SEGURANÇA
-- Impede que queries de exploração sem user_id sejam eficientes (além do RLS)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
