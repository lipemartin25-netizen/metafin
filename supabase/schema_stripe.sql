-- ============================================
-- SmartFinance Hub — Stripe Subscriptions v1.1
-- Execute APÓS o schema principal (schema.sql)
-- Idempotente: pode rodar múltiplas vezes
-- ============================================


-- =============================================
-- 1. CAMPOS STRIPE NO PROFILES
-- =============================================

-- Adicionar colunas uma por uma (mais seguro para idempotência)
DO $$
BEGIN
  -- stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripe_customer_unique UNIQUE (stripe_customer_id);
  END IF;

  -- stripe_subscription_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- subscription_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN ('inactive','active','trialing','past_due','canceled','unpaid','incomplete'));
  END IF;

  -- subscription_price_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_price_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_price_id TEXT;
  END IF;

  -- subscription_current_period_end
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_current_period_end'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
  END IF;

  -- is_internal (FREE ACCESS BYPASS)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_internal'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_internal BOOLEAN DEFAULT FALSE;
  END IF;
END;
$$;

-- Index para busca rápida por stripe_customer_id (usado nos webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;


-- =============================================
-- 2. TABELA DE PAGAMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'brl',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios pagamentos
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Sem policy de INSERT para authenticated → bloqueado para client ✅
-- Service role (Edge Functions) bypassa RLS automaticamente

CREATE INDEX IF NOT EXISTS idx_payments_user_id
  ON public.payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON public.payments(created_at DESC);


-- =============================================
-- 3. TRIGGER: SYNC PLAN FROM SUBSCRIPTION
-- =============================================
CREATE OR REPLACE FUNCTION public.sync_plan_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- FORÇAR PRO PARA TODOS OS USUÁRIOS (Stripe Desativado Temporariamente)
  NEW.plan = 'pro';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_plan_trigger ON public.profiles;
CREATE TRIGGER sync_plan_trigger
  BEFORE UPDATE OF subscription_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_plan_from_subscription();


-- =============================================
-- 4. VIEWS ADMIN — COM SECURITY INVOKER (Postgres 15+)
-- =============================================

CREATE OR REPLACE VIEW public.revenue_summary
WITH (security_invoker = on)
AS
SELECT
  date_trunc('month', created_at)::date AS month,
  COUNT(*) AS payment_count,
  SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) AS revenue,
  SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) AS failed_amount,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) AS success_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS fail_count
FROM public.payments
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.revenue_summary TO authenticated;
GRANT SELECT ON public.revenue_summary TO service_role;

CREATE OR REPLACE VIEW public.subscriber_summary
WITH (security_invoker = on)
AS
SELECT
  plan,
  subscription_status,
  COUNT(*) AS user_count
FROM public.profiles
GROUP BY plan, subscription_status
ORDER BY user_count DESC;

GRANT SELECT ON public.subscriber_summary TO authenticated;
GRANT SELECT ON public.subscriber_summary TO service_role;


-- =============================================
-- 5. FUNÇÕES ADMIN SEGURAS (Para Dashboard Admin)
-- Use estas funções para ver dados globais via service_role
-- =============================================

CREATE OR REPLACE FUNCTION public.admin_subscriber_stats()
RETURNS TABLE (
  plan TEXT,
  subscription_status TEXT,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado: apenas service_role pode chamar esta função';
  END IF;

  RETURN QUERY
  SELECT
    p.plan,
    p.subscription_status,
    COUNT(*)::BIGINT AS user_count
  FROM public.profiles p
  GROUP BY p.plan, p.subscription_status
  ORDER BY user_count DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_subscriber_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_subscriber_stats() TO service_role;


CREATE OR REPLACE FUNCTION public.admin_revenue_stats()
RETURNS TABLE (
  month DATE,
  payment_count BIGINT,
  revenue DECIMAL,
  failed_amount DECIMAL,
  success_count BIGINT,
  fail_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado: apenas service_role pode chamar esta função';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc('month', p.created_at)::date AS month,
    COUNT(*)::BIGINT AS payment_count,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END) AS revenue,
    SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END) AS failed_amount,
    COUNT(CASE WHEN p.status = 'succeeded' THEN 1 END)::BIGINT AS success_count,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END)::BIGINT AS fail_count
  FROM public.payments p
  GROUP BY 1
  ORDER BY 1 DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revenue_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revenue_stats() TO service_role;


-- =============================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Schema Stripe atualizado com SECURITY INVOKER views e Admin Functions.';
END;
$$;
