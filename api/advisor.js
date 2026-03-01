import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const { messages, token } = await req.json();

    if (!token) {
        return new Response('Unauthorized: Missing token', { status: 401 });
    }

    // 1. Initialize Supabase with the user's token
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );

    // 2. Validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return new Response('Unauthorized: Invalid session', { status: 401 });
    }

    // 3. Fetch User Financial Context (Real-time)
    const [
        { data: transactions },
        { data: goals },
        { data: summary }
    ] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(50),
        supabase.from('goals').select('*'),
        supabase.rpc('get_transaction_summary', { p_user_id: user.id })
    ]);

    // 4. Rate Limiting Logic (Simplified for Edge) 
    // Free = 3 msgs/day, Pro = 100+
    const { data: usage } = await supabase
        .from('advisor_usage')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

    const isPro = user.app_metadata?.plan === 'pro' || true; // Assuming PRO for now based on usePlan hook
    const limit = isPro ? 100 : 3;

    if (usage && usage.message_count >= limit) {
        return new Response(JSON.stringify({ error: 'Limite diário atingido. Faça upgrade para o plano Pro!' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 5. System Prompt Construction
    const contextText = `
    DADOS DO USUÁRIO (${user.email}):
    - Saldo Atual: ${summary?.total_balance || 0}
    - Receitas: ${summary?.total_income || 0}
    - Despesas: ${summary?.total_expense || 0}
    - Metas de Poupança: ${goals?.length || 0} metas ativas.
    - Transações Recentes (Últimas 50):
    ${transactions?.map(t => `- ${t.date}: ${t.description} (${t.category}) | ${t.amount}`).join('\n')}
  `;

    const result = await streamText({
        model: openai('gpt-4o'),
        system: `Você é o MetaFin AI Advisor, um especialista em finanças pessoais.
    Use os dados reais do usuário abaixo para dar conselhos precisos.
    O usuário busca Independência Financeira (FIRE).
    Responda em Markdown. Seja direto, porém empático.
    
    Contexto Atual:
    ${contextText}`,
        messages,
        onFinish: async (event) => {
            // Save assistant message to DB
            await supabase.from('advisor_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: event.text,
            });

            // Update usage
            await supabase.rpc('increment_advisor_usage', { p_user_id: user.id });
        }
    });

    return result.toDataStreamResponse();
}
