-- =============================================
-- AI Advisor Helper Function: Transaction Summary
-- =============================================

CREATE OR REPLACE FUNCTION public.get_transaction_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT json_build_object(
        'total_income', COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0),
        'total_expense', ABS(COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)),
        'total_balance', COALESCE(SUM(amount), 0),
        'last_30_days_expense', ABS(COALESCE(SUM(amount) FILTER (WHERE type = 'expense' AND date >= NOW() - INTERVAL '30 days'), 0))
    ) INTO result
    FROM public.transactions
    WHERE user_id = p_user_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
