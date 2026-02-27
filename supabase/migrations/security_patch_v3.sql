-- =============================================
-- SECURITY PATCH V3: Cross-Table Verification
-- MetaFin App - Final RLS & Integrity Audit
-- =============================================

-- 1. PROTEÇÃO DE ATIVOS (ASSETS)
-- Garante que ninguém acesse investimentos de terceiros
ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Assets owner only" ON public.assets;
CREATE POLICY "Assets owner only" ON public.assets 
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 2. PROTEÇÃO DE CONTAS BANCÁRIAS
-- Essencial para Open Finance
ALTER TABLE IF EXISTS public.bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Accounts owner only" ON public.bank_accounts;
CREATE POLICY "Accounts owner only" ON public.bank_accounts 
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. TABELA DE PERFIS (PROFILES)
-- Se existir, deve ser protegida para não vazar e-mails/nomes
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles 
FOR SELECT TO authenticated USING (auth.uid() = id);

-- 4. VALIDAÇÃO DE INTEGRIDADE (TRANSACTIONS)
-- Garante que o user_id não seja nulo em novas inserções
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;

-- 5. SEGURANÇA DE WEBHOOKS
-- Se houver tabela de logs de webhooks, proteja-a
ALTER TABLE IF EXISTS public.pluggy_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Internal only" ON public.pluggy_events;
CREATE POLICY "Internal only" ON public.pluggy_events 
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- FINALIZAÇÃO: RECONECTA PRIVILÉGIOS BÁSICOS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
