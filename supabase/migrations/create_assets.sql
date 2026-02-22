-- Create Assets Table (For Net Worth calculations)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'checking', 'savings', 'investment', 
    'property', 'vehicle', 'crypto', 'other_asset'
  )),
  current_value DECIMAL(14,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  is_liability BOOLEAN DEFAULT false,
  institution TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own assets" 
ON public.assets 
FOR ALL USING (auth.uid() = user_id);

-- Snapshot mensal automático para histórico (Net Worth History)
CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets DECIMAL(14,2) DEFAULT 0,
  total_liabilities DECIMAL(14,2) DEFAULT 0,
  net_worth DECIMAL(14,2) DEFAULT 0,
  breakdown JSONB,
  
  -- Um snapshot por mês por usuário para histórico evolutivo
  UNIQUE(user_id, snapshot_date)
);

-- Habilitar RLS
ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own net_worth_history" 
ON public.net_worth_history 
FOR ALL USING (auth.uid() = user_id);

-- Função plpgsql de Trigger para atualizar o Updated_At dos Assets
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Assets
DROP TRIGGER IF EXISTS on_asset_updated ON public.assets;
CREATE TRIGGER on_asset_updated
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
