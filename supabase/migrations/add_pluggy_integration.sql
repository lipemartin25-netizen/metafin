-- =============================================
-- MIGRATION: Pluggy Open Finance Integration
-- =============================================

-- 1. Table for Pluggy Connections (Items)
CREATE TABLE IF NOT EXISTS public.of_connections (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'pluggy',
    provider_item_id TEXT NOT NULL UNIQUE, -- ID do Item no Pluggy
    status TEXT DEFAULT 'UPDATING' CHECK (
        status IN (
            'UPDATED',
            'UPDATING',
            'WAITING_USER_INPUT',
            'LOGIN_ERROR',
            'OUTDATED',
            'REVOKED'
        )
    ),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for Bank Accounts from Pluggy
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    connection_id UUID REFERENCES public.of_connections (id) ON DELETE CASCADE,
    provider_account_id TEXT NOT NULL UNIQUE,
    bank_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    type TEXT, -- CHECKING, SAVINGS, CREDIT, etc.
    number TEXT, -- Mascarado pelo backend ou guardado aqui se seguro
    balance_current NUMERIC(15, 2) DEFAULT 0,
    balance_available NUMERIC(15, 2) DEFAULT 0,
    currency_code TEXT DEFAULT 'BRL',
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for Bank Transactions from Pluggy
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.bank_accounts (id) ON DELETE CASCADE,
    provider_transaction_id TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency_code TEXT DEFAULT 'BRL',
    date TIMESTAMPTZ NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'POSTED',
    type TEXT CHECK (type IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Policies
ALTER TABLE public.of_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.of_connections FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_transactions FORCE ROW LEVEL SECURITY;

-- Policies for of_connections
CREATE POLICY "of_conn_select" ON public.of_connections FOR
SELECT TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "of_conn_delete" ON public.of_connections FOR DELETE TO authenticated USING (auth.uid () = user_id);

-- Policies for bank_accounts
CREATE POLICY "bank_acc_select" ON public.bank_accounts FOR
SELECT TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "bank_acc_delete" ON public.bank_accounts FOR DELETE TO authenticated USING (auth.uid () = user_id);

-- Policies for bank_transactions
CREATE POLICY "bank_tx_select" ON public.bank_transactions FOR
SELECT TO authenticated USING (auth.uid () = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_of_conn_user ON public.of_connections (user_id);

CREATE INDEX IF NOT EXISTS idx_bank_acc_user ON public.bank_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_bank_tx_user ON public.bank_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_bank_tx_account ON public.bank_transactions (account_id);

CREATE INDEX IF NOT EXISTS idx_bank_tx_date ON public.bank_transactions (date DESC);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_of_conn BEFORE UPDATE ON public.of_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_bank_acc BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();