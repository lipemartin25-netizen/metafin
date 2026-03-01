-- =============================================
-- AI Advisor v3.0 - Database Tables 
-- =============================================

-- 1. ADVISOR CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.advisor_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Nova conversa',
  model TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADVISOR MESSAGES (Chat History)
CREATE TABLE IF NOT EXISTS public.advisor_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.advisor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADVISOR USAGE (Daily Rate Limits)
CREATE TABLE IF NOT EXISTS public.advisor_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  message_count INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- RLS POLICIES
ALTER TABLE advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_usage ENABLE ROW LEVEL SECURITY;

-- Conversations Policy
CREATE POLICY "advisor_conversations_own" ON advisor_conversations
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Messages Policy
CREATE POLICY "advisor_messages_own" ON advisor_messages
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Usage Policy
CREATE POLICY "advisor_usage_own" ON advisor_usage
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at on advisor_conversations
DROP TRIGGER IF EXISTS tr_advisor_conversations_updated_at ON public.advisor_conversations;
CREATE TRIGGER tr_advisor_conversations_updated_at
    BEFORE UPDATE ON public.advisor_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RPC for incrementing usage (Edge friendly)
CREATE OR REPLACE FUNCTION public.increment_advisor_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO advisor_usage (user_id, date, message_count)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) DO UPDATE 
    SET message_count = advisor_usage.message_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
