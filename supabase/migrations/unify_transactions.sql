-- 1. Adicionar colunas necessárias na tabela principal "transactions"
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS provider_transaction_id text,
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- 2. Garantir restrição de unicidade para evitar transações duplicadas do Pluggy
-- Primeiro, checa se a constraint existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_provider_transaction_id_key') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_provider_transaction_id_key UNIQUE (provider_transaction_id);
    END IF;
END $$;

-- 3. Atualizar o comentário da tabela para refletir a nova configuração
COMMENT ON TABLE public.transactions IS 'Transações unificadas (Manuais e Open Finance/Pluggy)';
