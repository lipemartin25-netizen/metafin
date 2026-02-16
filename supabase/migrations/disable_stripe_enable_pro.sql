-- ============================================
-- DISABLE STRIPE & ENABLE PRO FOR ALL
-- ============================================

-- 1. Atualizar a função de sincronização para SEMPRE retornar 'pro'
CREATE OR REPLACE FUNCTION public.sync_plan_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- FORÇAR PRO PARA TODOS OS USUÁRIOS
  NEW.plan = 'pro';
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Atualizar todos os usuários existentes para o plano PRO
UPDATE public.profiles
SET plan = 'pro',
    updated_at = NOW()
WHERE plan IS DISTINCT FROM 'pro';

-- 3. Garantir que novos usuários também nasçam como PRO (opcional, mas recomendado via default)
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'pro';

-- 4. Notificar conclusão
DO $$
BEGIN
  RAISE NOTICE 'Acesso Pro liberado para todos os usuários e Stripe desativado no BD.';
END;
$$;
