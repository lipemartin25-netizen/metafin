// api/_lib/nexusEnricher.js
import { createClient } from '@supabase/supabase-js'

/**
 * Busca o contexto financeiro real do usuário para injetar no prompt do Advisor.
 */
export async function getFinancialContext(userId) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // 1. Balanço Geral e Transações Recentes
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('date, description, amount, category, type')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(10)

        // 2. Metas de Riqueza (Wealth/FIRE)
        const { data: goals, error: goalError } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', userId)

        // 3. Perfil (Plano/Nome)
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, plan')
            .eq('id', userId)
            .single()

        if (txError || goalError) {
            console.error('[nexus-enricher] Erro ao buscar dados:', { txError, goalError })
            return 'Dados financeiros indisponíveis no momento.'
        }

        const now = new Date().toLocaleDateString('pt-BR')

        return {
            timestamp: now,
            user_name: profile?.full_name || 'Usuário',
            tier: profile?.plan || 'free',
            recent_transactions: transactions,
            wealth_goals: goals,
            summary: `O usuário ${profile?.full_name || ''} possui ${goals?.length || 0} metas financeiras ativas. Suas últimas 10 transações foram processadas.`
        }

    } catch (err) {
        console.error('[nexus-enricher] Falha crítica:', err.message)
        return 'Erro interno ao recuperar contexto financeiro.'
    }
}

/**
 * Formata o contexto em um System Prompt altamente eficiente.
 */
export function formatSystemPrompt(context) {
    if (typeof context === 'string') return context

    return `
Você é o Nexus, o Advisor Financeiro Premium da MetaFin. 
HOJE É: ${context.timestamp}
DADOS DO USUÁRIO (${context.user_name}):
- Tier: ${context.tier}
- Metas Financeiras: ${context.wealth_goals.map(g => `${g.name} (Meta: ${g.target_amount}, Saldo: ${g.current_amount})`).join('; ')}
- Transações Recentes: ${context.recent_transactions.map(t => `${t.date}: ${t.description} (${t.amount})`).join('; ')}

DIRETRIZES:
1. Seja proativo. Se notar que o usuário está longe de uma meta, sugira economias.
2. Seja preciso com números. Não invente saldos.
3. Se perguntado sobre ações/mercado e não tiver dados reais, avise que a análise é técnica baseada na imagem/print fornecida (se houver).
4. Seu tom é sofisticado, encorajador e profissional.
`
}
