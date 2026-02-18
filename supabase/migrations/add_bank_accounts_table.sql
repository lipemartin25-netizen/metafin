-- ========================================================
-- MIGRATION: Add bank_accounts table with RLS
-- ========================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    bank_id TEXT NOT NULL, -- Ex: 'nubank', 'itau'
    name TEXT NOT NULL, -- Apelido da conta
    agency TEXT,
    account_number TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    color TEXT,
    logo TEXT,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts FORCE ROW LEVEL SECURITY;

-- 3. Create Policy: Users can only manage their own accounts
DROP POLICY IF EXISTS "bank_accounts_all_own" ON public.bank_accounts;

CREATE POLICY "bank_accounts_all_own" ON public.bank_accounts FOR ALL TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts (user_id);

-- 5. Auto-update updated_at trigger
DROP TRIGGER IF EXISTS bank_accounts_updated_at ON public.bank_accounts;

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();