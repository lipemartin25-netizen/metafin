import { checkRateLimit } from './_lib/rateLimit.js'
import { validateSession } from './_lib/auth.js'
import { GoogleGenAI, Type } from '@google/genai'

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://metafin-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
}

export default async function handler(req, res) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

    const session = await validateSession(req)
    if (!session.valid) {
        return res.status(401).json({ error: `Não autorizado: ${session.reason}` })
    }

    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
    const rateLimitKey = `health:${session.userId || ip}`
    const limit = checkRateLimit(rateLimitKey, 10, 60000)

    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter))
        return res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' })
    }

    const { financialData } = req.body
    if (!financialData) {
        return res.status(400).json({ error: 'Dados financeiros são obrigatórios' })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
        return res.status(500).json({ error: 'Configuração da API Gemini ausente no servidor' })
    }

    try {
        const ai = new GoogleGenAI({ apiKey })

        const prompt = `
Você é o MetaFin, um assistente financeiro de elite extremamente focado e direto ao ponto.
Abaixo estão os dados financeiros do usuário deste mês.

Receita: R$ ${financialData.income}
Despesas: R$ ${financialData.expenses}
Saldo Atual: R$ ${financialData.balance}
Taxa de Poupança Atual: ${financialData.savingsRate}%
Maiores Categorias de Gasto: ${JSON.stringify(financialData.topCategories)}

Sua tarefa: Forneça 3 ou 4 dicas ou recomendações acionáveis, baseadas exatemente nos números fornecidos. 

Regras para as dicas:
- Seja conciso e use poucas palavras. Sem introduções longas.
- classifique visualmente o 'tipo' da dica entre: 'success', 'warning', 'danger', ou 'info'.
  - 'success' para comemorar ou apontar uma meta boa (ex: salvou mais que 20%).
  - 'warning' para atenção (ex: muitos gastos em uma só categoria).
  - 'danger' para risco imediato (ex: despesas maiores que receitas, saldo negativo).
  - 'info' para dicas factuais ou constatações genéricas mas úteis.
- Sempre retorne JSON válido usando a estrutura informada, e não use blocos de \`\`\`json.
        `

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: "Aja como um analista financeiro conciso. Retorne estritamente o JSON da estrutura definida em português do Brasil.",
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tips: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING, description: "O texto encorajador, corretivo ou direto da sugestão" },
                                    type: { type: Type.STRING, enum: ["success", "warning", "danger", "info"], description: "Severidade ou tema da dica" }
                                },
                                required: ["text", "type"]
                            }
                        }
                    },
                    required: ["tips"]
                }
            }
        })

        // A resposta já é validada e formatada como JSON pela API do Gemini
        let tipsData
        try {
            tipsData = JSON.parse(response.text)
        } catch (_e) {
            console.error('Falha ao parsear JSON Gemini:', response.text)
            throw new Error('Falha no formato da IA')
        }

        return res.status(200).json(tipsData)

    } catch (err) {
        console.error('Erro ao gerar insights:', err)
        return res.status(500).json({ error: 'Falha ao processar insights financeiros' })
    }
}
