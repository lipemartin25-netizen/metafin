-- =============================================
-- MetaFin Nexus v3.0 - Database Expansion
-- Tables for AI Advisor, Proactive Insights and Multimodal Tasks
-- =============================================

-- 1. NEXUS CHAT HISTORY (AI Advisor Memory)
CREATE TABLE IF NOT EXISTS public.nexus_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT NOT NULL, -- 'gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro', etc.
    metadata JSONB DEFAULT '{}', -- Store tool call results or vision contextual data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NEXUS INSIGHTS (Proactive Dashboard Briefings)
CREATE TABLE IF NOT EXISTS public.nexus_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('alert', 'suggestion', 'briefing')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0, -- Used to prioritize top insights in sidebar
    is_read BOOLEAN DEFAULT FALSE,
    action_link TEXT, -- Link to specific page/feature (e.g., /wealth)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 3. NEXUS MULTIMODAL TASKS (Vision & OCR Tracking)
CREATE TABLE IF NOT EXISTS public.nexus_multimodal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('receipt_ocr', 'statement_pdf', 'chart_analysis')),
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'error')),
    result_json JSONB, -- Final extraction data
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECURITY: RLS POLICIES (All tables)
-- =============================================

ALTER TABLE public.nexus_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexus_multimodal_tasks ENABLE ROW LEVEL SECURITY;

-- Chat History Policies
DROP POLICY IF EXISTS "nexus_chat_all_own" ON public.nexus_chat_history;
CREATE POLICY "nexus_chat_all_own" ON public.nexus_chat_history
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Insights Policies
DROP POLICY IF EXISTS "nexus_insights_all_own" ON public.nexus_insights;
CREATE POLICY "nexus_insights_all_own" ON public.nexus_insights
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Multimodal Tasks Policies
DROP POLICY IF EXISTS "nexus_tasks_all_own" ON public.nexus_multimodal_tasks;
CREATE POLICY "nexus_tasks_all_own" ON public.nexus_multimodal_tasks
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- PERFORMANCE: INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_nexus_chat_user ON public.nexus_chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_insights_user ON public.nexus_insights(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_tasks_user ON public.nexus_multimodal_tasks(user_id, created_at DESC);

-- Trigger for updated_at on multimodal tasks
DROP TRIGGER IF EXISTS tr_nexus_tasks_updated_at ON public.nexus_multimodal_tasks;
CREATE TRIGGER tr_nexus_tasks_updated_at
    BEFORE UPDATE ON public.nexus_multimodal_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DO $$
BEGIN
    RAISE NOTICE '✅ Nexus v3.0 Database Schema ready for implementation!';
END;
$$;
