// api/nexus/insights.js
import { validateSession } from '../_lib/auth.js'
import { createClient } from '@supabase/supabase-js'
import { getFinancialContext } from '../_lib/nexusEnricher.js'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

    const session = await validateSession(req);
    if (!session.valid) return res.status(401).json({ error: 'Não autorizado' });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // 1. Verificar se já existe briefing para hoje
        const today = new Date().toISOString().split('T')[0];
        const { data: existing, error: findError } = await supabase
            .from('nexus_insights')
            .select('*')
            .eq('user_id', session.userId)
            .gte('created_at', today)
            .limit(3);

        if (existing?.length > 0) {
            return res.status(200).json({ insights: existing, source: 'cache' });
        }

        // 2. Gerar novo briefing (se não houver)
        const context = await getFinancialContext(session.userId);
        const briefing = await generateAIBriefing(context);

        // 3. Salvar no Banco
        const { data: saved, error: saveError } = await supabase
            .from('nexus_insights')
            .insert(briefing.map(b => ({ ...b, user_id: session.userId })))
            .select();

        if (saveError) throw saveError;

        return res.status(200).json({ insights: saved, source: 'ai_generated' });

    } catch (error) {
        console.error('[nexus-insights] Erro:', error.message);
        return res.status(500).json({ error: 'Falha ao gerar briefing diário' });
    }
}

async function generateAIBriefing(context) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Analise os dados financeiros abaixo e gere 3 insights curtos e impactantes para o dashboard do usuário.
DADOS: ${JSON.stringify(context)}

Retorne APENAS um JSON Array no formato:
[
  {"type": "briefing", "title": "...", "message": "...", "relevance_score": 10, "action_link": "/transactions"},
  {"type": "alert", "title": "...", "message": "...", "relevance_score": 8, "action_link": "/wealth"},
  {"type": "suggestion", "title": "...", "message": "...", "relevance_score": 7, "action_link": "/dashboard"}
]
Regras:
1. "briefing" é um resumo geral do saldo/gastos recentes.
2. "alert" é sobre metas FIRE ou orçamentos estourados.
3. "suggestion" é um conselho prático de economia.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();

    try {
        return JSON.parse(text);
    } catch {
        // Fallback se a IA falhar no JSON
        return [{
            type: 'briefing',
            title: 'Nexus pronto',
            message: 'Seu Advisor está pronto para analisar suas finanças. Pergunte-me qualquer coisa!',
            relevance_score: 5,
            action_link: '/dashboard'
        }];
    }
}
