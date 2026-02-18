-- ========================================================
-- UNIVERSAL MIGRATION: Bank Accounts (Manual + Open Finance)
-- Este script limpa conflitos e cria a estrutura definitiva.
-- ========================================================

-- 1. Garantir que a função de update existe
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar Tabelas Base
CREATE TABLE IF NOT EXISTS public.of_connections (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'pluggy',
    provider_item_id TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'UPDATING',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES public.of_connections (id) ON DELETE CASCADE,

-- Campos de Identificação
bank_id TEXT, -- Ex: 'nubank', 'itau'
bank_name TEXT NOT NULL, -- Nome da Instituição
display_name TEXT NOT NULL, -- Apelido da conta

-- Dados da Conta (Seguros/Mascarados)
agency TEXT,
account_number TEXT,
provider_account_id TEXT UNIQUE, -- ID único no Pluggy

-- Financeiro
balance NUMERIC(15, 2) DEFAULT 0,
currency_code TEXT DEFAULT 'BRL',

-- Estética
color TEXT,
    logo_url TEXT,
    
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Segurança (RLS)
ALTER TABLE public.of_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.of_connections FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bank_accounts FORCE ROW LEVEL SECURITY;

-- 4. Limpar e Recriar Policies (Evita erro de "already exists")
DO $$ 
BEGIN
    -- Connections
    DROP POLICY IF EXISTS "of_conn_select" ON public.of_connections;
    DROP POLICY IF EXISTS "of_conn_delete" ON public.of_connections;
    
    -- Bank Accounts
    DROP POLICY IF EXISTS "bank_acc_select" ON public.bank_accounts;
    DROP POLICY IF EXISTS "bank_acc_insert" ON public.bank_accounts;
    DROP POLICY IF EXISTS "bank_acc_update" ON public.bank_accounts;
    DROP POLICY IF EXISTS "bank_acc_delete" ON public.bank_accounts;
    DROP POLICY IF EXISTS "bank_accounts_all_own" ON public.bank_accounts;
END $$;

-- Criar Novas Policies
CREATE POLICY "of_conn_select" ON public.of_connections FOR
SELECT TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "of_conn_delete" ON public.of_connections FOR DELETE TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "bank_acc_select" ON public.bank_accounts FOR
SELECT TO authenticated USING (auth.uid () = user_id);

CREATE POLICY "bank_acc_insert" ON public.bank_accounts FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "bank_acc_update" ON public.bank_accounts FOR
UPDATE TO authenticated USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "bank_acc_delete" ON public.bank_accounts FOR DELETE TO authenticated USING (auth.uid () = user_id);

-- 5. Triggers
DROP TRIGGER IF EXISTS set_updated_at_of_conn ON public.of_connections;

CREATE TRIGGER set_updated_at_of_conn BEFORE UPDATE ON public.of_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_bank_acc ON public.bank_accounts;

CREATE TRIGGER set_updated_at_bank_acc BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();