import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting simples em memória (para produção, use Redis/KV)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requisições
const RATE_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    return true;
}

// Providers de IA
async function callOpenAI(messages: any[], model: string) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OpenAI API key não configurada");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages,
            max_tokens: 2000,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI error: ${error}`);
    }

    const data = await response.json();
    return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
    };
}

async function callAnthropic(messages: any[], model: string) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("Anthropic API key não configurada");

    // Converter formato OpenAI para Anthropic
    const systemMessage = messages.find((m: any) => m.role === "system")?.content || "";
    const chatMessages = messages
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({ role: m.role, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: model || "claude-3-haiku-20240307",
            max_tokens: 2000,
            system: systemMessage,
            messages: chatMessages,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic error: ${error}`);
    }

    const data = await response.json();
    return {
        content: data.content[0].text,
        model: data.model,
        usage: data.usage,
    };
}

async function callGemini(messages: any[], model: string) {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) throw new Error("Google AI API key não configurada");

    // Converter formato para Gemini
    const contents = messages
        .filter((m: any) => m.role !== "system")
        .map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find((m: any) => m.role === "system")?.content;

    const modelName = model || "gemini-1.5-flash";
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini error: ${error}`);
    }

    const data = await response.json();
    return {
        content: data.candidates[0].content.parts[0].text,
        model: modelName,
        usage: data.usageMetadata,
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Verificar autenticação
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Não autorizado" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Criar cliente Supabase para verificar o usuário
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Usuário não autenticado" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Rate limiting
        if (!checkRateLimit(user.id)) {
            return new Response(
                JSON.stringify({ error: "Limite de requisições excedido. Aguarde 1 minuto." }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verificar se usuário é Pro (opcional)
        const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .single();

        const isPro = profile?.plan === "pro" || profile?.plan === "enterprise";

        // Parse request body
        const { messages, model, provider } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: "Mensagens inválidas" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Modelos permitidos por plano
        const freeModels = ["gemini-flash", "gemini-1.5-flash"];

        const requestedModel = model || "gemini-1.5-flash";

        if (!isPro && !freeModels.some(m => requestedModel.includes(m))) {
            return new Response(
                JSON.stringify({ error: "Modelo não disponível no plano gratuito" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Chamar provider correto
        const startTime = Date.now();
        let result;

        const providerName = provider || detectProvider(requestedModel);

        switch (providerName) {
            case "openai":
                result = await callOpenAI(messages, requestedModel);
                break;
            case "anthropic":
                result = await callAnthropic(messages, requestedModel);
                break;
            case "google":
            default:
                result = await callGemini(messages, requestedModel);
                break;
        }

        const latency = Date.now() - startTime;

        // Log de uso (para analytics) - Opcional, cria tabela if not exists no supabase
        // await supabase.from("ai_usage_logs").insert({
        //     user_id: user.id,
        //     model: result.model,
        //     provider: providerName,
        //     latency_ms: latency,
        //     tokens_used: result.usage?.total_tokens || null,
        // }).catch(() => {}); 

        return new Response(
            JSON.stringify({
                content: result.content,
                model: result.model,
                provider: providerName,
                latency,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("AI Chat Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Erro interno" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

function detectProvider(model: string): string {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    return "google";
}
