-- ============================================
-- FIX: Security Definer Views
-- Resolve lint: "View defined with SECURITY DEFINER"
-- Aplica SECURITY INVOKER para respeitar RLS
-- ============================================

-- =============================================
-- 1. REVENUE_SUMMARY
-- Antes: SECURITY DEFINER (qualquer user via dados de todos)
-- Depois: SECURITY INVOKER (responde com dados do caller)
-- =============================================

-- Dropar a view antiga
DROP VIEW IF EXISTS public.revenue_summary;

-- Recriar como SECURITY INVOKER
CREATE VIEW public.revenue_summary
WITH (security_invoker = on)
AS
SELECT
  date_trunc('month', created_at)::date AS month,
  COUNT(*)                              AS payment_count,
  SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) AS revenue,
  SUM(CASE WHEN status = 'failed'    THEN amount ELSE 0 END) AS failed_amount,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END)           AS success_count,
  COUNT(CASE WHEN status = 'failed'    THEN 1 END)           AS fail_count
FROM public.payments
GROUP BY 1
ORDER BY 1 DESC;

-- Permissões
GRANT SELECT ON public.revenue_summary TO authenticated;
GRANT SELECT ON public.revenue_summary TO service_role;


-- =============================================
-- 2. SUBSCRIBER_SUMMARY
-- Antes: SECURITY DEFINER (expõe contagem de todos os users)
-- Depois: SECURITY INVOKER
-- =============================================

DROP VIEW IF EXISTS public.subscriber_summary;

CREATE VIEW public.subscriber_summary
WITH (security_invoker = on)
AS
SELECT
  plan,
  subscription_status,
  COUNT(*) AS user_count
FROM public.profiles
GROUP BY plan, subscription_status
ORDER BY user_count DESC;

-- Permissões
GRANT SELECT ON public.subscriber_summary TO authenticated;
GRANT SELECT ON public.subscriber_summary TO service_role;


-- =============================================
-- 3. GARANTIR QUE PROFILES E PAYMENTS TÊM RLS CORRETA
-- =============================================

-- Verificar/recriar policy de SELECT no profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own"
      ON public.profiles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id);
  END IF;
END;
$$;

-- Verificar/recriar policy de SELECT no payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_select_own'
  ) THEN
    CREATE POLICY "payments_select_own"
      ON public.payments FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END;
$$;


-- =============================================
-- 4. FUNÇÕES ADMIN SEGURAS (SECURITY DEFINER)
-- Só podem ser chamadas via service_role
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
