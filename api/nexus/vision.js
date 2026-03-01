// api/nexus/vision.js
import { validateSession } from '../_lib/auth.js'
import { createClient } from '@supabase/supabase-js'

/**
 * Nexus Vision OCR Endpoint
 * Recebe imagem/pdf, extrai dados via Gemini Flash e cria transação.
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const session = await validateSession(req);
    if (!session.valid) return res.status(401).json({ error: 'Não autorizado' });

    try {
        // 1. Parsing simplificado do arquivo (Buffer)
        // Nota: Vercel parseia automaticamente JSON, mas para multipart/form-data
        // precisamos de um parseador se o arquivo for enviado via form.
        // Se o arquivo for enviado como base64 no JSON, é mais simples.

        let fileData, mimeType, taskType;
        if (typeof req.body === 'string') {
            const body = JSON.parse(req.body);
            fileData = body.fileB64; // "data:image/png;base64,iVBOR..."
            mimeType = fileData.split(';')[0].split(':')[1];
            fileData = fileData.split(',')[1];
            taskType = body.taskType || 'receipt_ocr';
        } else {
            // Suporte para raw body se necessário
            return res.status(400).json({ error: 'Envie o arquivo via Base64 JSON (fileB64)' });
        }

        // 2. Extração via Gemini 1.5 Flash
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = taskType === 'receipt_ocr'
            ? 'Extraia desta foto de cupom fiscal: {data, descrição, valor, categoria}. Retorne apenas JSON.'
            : 'Extraia deste extrato PDF as transações significativas: {data, descrição, valor, categoria, tipo: income/expense}. Retorne apenas JSON array.';

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileData,
                    mimeType: mimeType
                }
            }
        ]);

        const textResult = result.response.text().replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(textResult);

        // 3. Persistência Automática em transactions (Task 3.3)
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
        const supabase = createClient(supabaseUrl, supabaseKey)

        if (Array.isArray(parsedData)) {
            // Múltiplas transações (Extrato)
            const transactions = parsedData.map(t => ({
                user_id: session.userId,
                date: t.date || new Date().toISOString().split('T')[0],
                description: `[VISION] ${t.description}`,
                amount: t.amount,
                category: t.category || 'Outros',
                type: t.amount >= 0 ? 'income' : t.type || 'expense',
                status: 'categorized'
            }));
            const { data } = await supabase.from('transactions').insert(transactions).select();
            return res.status(200).json({ success: true, count: data?.length, data });
        } else {
            // Cupom Único
            const transaction = {
                user_id: session.userId,
                date: parsedData.date || new Date().toISOString().split('T')[0],
                description: `[VISION] ${parsedData.description}`,
                amount: parsedData.amount,
                category: parsedData.category || 'Alimentação',
                type: 'expense',
                status: 'categorized'
            };
            const { data } = await supabase.from('transactions').insert(transaction).select();
            return res.status(200).json({ success: true, data: data[0] });
        }

    } catch (error) {
        console.error('[nexus-vision] Erro:', error.message);
        return res.status(500).json({ error: 'Erro no processamento visual da IA.' });
    }
}
