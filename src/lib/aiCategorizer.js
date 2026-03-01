import { supabase } from './supabase';

/**
 * Sugere categorias para uma lista de descrições usando IA
 * @param {Array<string>} descriptions - Lista de descrições de transações
 * @returns {Promise<Object>} Mapeamento de descrição -> categoria
 */
export async function suggestCategories(descriptions) {
    if (!descriptions || descriptions.length === 0) return {};

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) throw new Error('Não autenticado');

        const response = await fetch('/api/ai-categorize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ descriptions }),
        });

        if (!response.ok) {
            // Em caso de erro (edge function não pronta), retorna vazio
            return {};
        }

        const data = await response.json();
        return data.categories || {}; // { "Uber": "transporte", "iFood": "alimentacao" }
    } catch (err) {
        console.warn('AI Categorization failed:', err);
        return {};
    }
}
