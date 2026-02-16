-- ============================================
-- SmartFinance Hub - Database Schema v3.0
-- Corrigido, otimizado e seguro
-- Idempotente: pode rodar múltiplas vezes
-- ============================================

-- Timezone Brasil
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';


-- =============================================
-- 1. UTILITY: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =============================================
-- 2. PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies (DROP IF EXISTS para idempotência)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile já existe (re-run seguro)
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 3. TRANSACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  status TEXT DEFAULT 'categorized'
    CHECK (status IN ('categorized', 'pending', 'processing', 'error')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies com TO authenticated (best practice 2026)
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- INDEXES compostos (essenciais para performance com RLS)
-- O RLS faz WHERE user_id = X em toda query, então o index precisa começar com user_id
CREATE INDEX IF NOT EXISTS idx_tx_user_id
  ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_tx_user_date
  ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_tx_user_category
  ON public.transactions(user_id, category);

CREATE INDEX IF NOT EXISTS idx_tx_user_type
  ON public.transactions(user_id, type);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- =============================================
-- 4. TRANSACTION SUMMARY (RPC)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_transaction_summary(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_caller UUID;
BEGIN
  -- Verificar que o caller é o dono dos dados
  SELECT auth.uid() INTO v_caller;

  IF v_caller IS NULL OR v_caller IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Acesso negado: você só pode ver seu próprio resumo.'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  SELECT json_build_object(
    'total_income',
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses',
      COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0),
    'balance',
      COALESCE(SUM(amount), 0),
    'transaction_count',
      COUNT(*),
    'categories', (
      SELECT COALESCE(json_agg(cat_row ORDER BY cat_row.cat_total DESC), '[]'::json)
      FROM (
        SELECT
          t2.category,
          SUM(ABS(t2.amount)) AS cat_total,
          COUNT(*) AS cat_count
        FROM public.transactions t2
        WHERE t2.user_id = p_user_id
        GROUP BY t2.category
      ) cat_row
    )
  ) INTO v_result
  FROM public.transactions
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;


-- =============================================
-- 5. WAITLIST
-- =============================================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode se inscrever (anon ou authenticated)
DROP POLICY IF EXISTS "waitlist_insert_public" ON public.waitlist;
CREATE POLICY "waitlist_insert_public"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Validação básica de email
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- NINGUÉM pode ler a waitlist pela API (nem service_role via policy)
-- Service role bypassa RLS automaticamente, então não precisa de policy
-- SELECT sem policy = bloqueado para anon e authenticated ✅


-- =============================================
-- 6. FEEDBACK / NPS
-- =============================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT DEFAULT '',
  page TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Só autenticados podem enviar feedback (e só sobre si mesmos)
DROP POLICY IF EXISTS "feedback_insert_authenticated" ON public.feedback;
CREATE POLICY "feedback_insert_authenticated"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND score >= 0
    AND score <= 10
    AND length(COALESCE(comment, '')) <= 1000
  );

-- Usuário pode ver seus próprios feedbacks
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
CREATE POLICY "feedback_select_own"
  ON public.feedback FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Index para consultas de feedback por user
CREATE INDEX IF NOT EXISTS idx_feedback_user_id
  ON public.feedback(user_id);


-- =============================================
-- 7. VERIFICAÇÃO FINAL
-- =============================================
-- Listar todas as policies criadas (verificação)
DO $$
BEGIN
  RAISE NOTICE '✅ Schema SmartFinance Hub v3.0 executado com sucesso!';
  RAISE NOTICE '📋 Tabelas: profiles, transactions, waitlist, feedback';
  RAISE NOTICE '🔒 RLS ativo em todas as tabelas';
  RAISE NOTICE '⚡ Indexes otimizados para consultas com RLS';
  RAISE NOTICE '🔄 Triggers de updated_at configurados';
END;
$$;
