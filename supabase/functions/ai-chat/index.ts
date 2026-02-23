/**
 * MetaFin - AI Chat Edge Function (Supabase)
 * Proxy seguro para chamadas de IA.
 * As API keys ficam APENAS no servidor (Supabase Secrets).
 *
 * Secrets necessarios (configurar via supabase secrets set):
 *   OPENAI_API_KEY
 *   GEMINI_API_KEY
 *   ANTHROPIC_API_KEY   (opcional)
 *   DEEPSEEK_API_KEY    (opcional)
 *   GROK_API_KEY        (opcional)
 *   QWEN_API_KEY        (opcional)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: object, status: number) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

// ========== PROVIDER CONFIG ==========
interface ModelConfig {
    provider: string;
    model: string;
}

const MODELS: Record<string, ModelConfig> = {
    "gpt-5-nano": { provider: "openai", model: "gpt-4o-mini" },
    "gpt-5": { provider: "openai", model: "gpt-4o-mini" },
    "gemini-flash": { provider: "google", model: "gemini-1.5-flash" },
    "claude-sonnet": { provider: "anthropic", model: "claude-3-5-sonnet-20240620" },
    deepseek: { provider: "deepseek", model: "deepseek-chat" },
    "grok-fast": { provider: "xai", model: "grok-beta" },
    qwen: { provider: "alibaba", model: "qwen-turbo" },
};

const ENDPOINTS: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    google: "https://generativelanguage.googleapis.com/v1beta/models",
    anthropic: "https://api.anthropic.com/v1/messages",
    deepseek: "https://api.deepseek.com/chat/completions",
    xai: "https://api.x.ai/v1/chat/completions",
    alibaba: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
};

function getApiKey(provider: string): string {
    const map: Record<string, string> = {
        openai: "OPENAI_API_KEY",
        google: "GEMINI_API_KEY",
        anthropic: "ANTHROPIC_API_KEY",
        deepseek: "DEEPSEEK_API_KEY",
        xai: "GROK_API_KEY",
        alibaba: "QWEN_API_KEY",
    };
    return Deno.env.get(map[provider] || "") || "";
}

// ========== PROVIDER CALLERS ==========

async function callOpenAICompatible(
    endpoint: string,
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number,
) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API Error: ${res.status}`);
    }

    const data = await res.json();
    return {
        content: data.choices?.[0]?.message?.content || "",
        usage: data.usage || {},
        model: data.model || model,
    };
}

async function callGemini(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number,
) {
    const modelId = model.startsWith("gemini") ? model : "gemini-1.5-flash";
    const url = `${ENDPOINTS.google}/${modelId}:generateContent?key=${apiKey}`;

    const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find((m) => m.role === "system");

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction.content }] }
                : undefined,
            generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini Error: ${res.status}`);
    }

    const data = await res.json();
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
        usage: data.usageMetadata || {},
        model,
    };
}

async function callAnthropic(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number,
) {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const res = await fetch(ENDPOINTS.anthropic, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemMsg?.content || "",
            messages: chatMessages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Claude Error: ${res.status}`);
    }

    const data = await res.json();
    return {
        content: data.content?.[0]?.text || "",
        usage: data.usage || {},
        model,
    };
}

// ========== MAIN HANDLER ==========
Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return respond({ error: "Method not allowed" }, 405);
    }

    try {
        // 1. Autenticar usuario
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return respond({ error: "Authorization required" }, 401);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return respond({ error: "Unauthorized" }, 401);
        }

        // 2. Parse body
        const { modelId, messages, options } = await req.json();

        if (!modelId || !messages || !Array.isArray(messages)) {
            return respond({ error: "modelId and messages are required" }, 400);
        }

        // Limite de mensagens para evitar abuso
        if (messages.length > 50) {
            return respond({ error: "Maximum 50 messages per call" }, 400);
        }

        // 3. Resolver modelo
        const modelConfig = MODELS[modelId];
        if (!modelConfig) {
            return respond({ error: `Model "${modelId}" not found` }, 400);
        }

        const apiKey = getApiKey(modelConfig.provider);
        if (!apiKey) {
            return respond(
                {
                    error: `API key not configured for ${modelConfig.provider}. Set via: supabase secrets set ${modelConfig.provider.toUpperCase()}_API_KEY=...`,
                },
                500,
            );
        }

        const temperature = options?.temperature ?? 0.7;
        const maxTokens = Math.min(options?.maxTokens ?? 2048, 4096);

        // 4. Chamar provider
        const startTime = Date.now();
        let result;

        switch (modelConfig.provider) {
            case "openai":
                result = await callOpenAICompatible(
                    ENDPOINTS.openai, apiKey, modelConfig.model, messages, temperature, maxTokens,
                );
                break;
            case "google":
                result = await callGemini(apiKey, modelConfig.model, messages, temperature, maxTokens);
                break;
            case "anthropic":
                result = await callAnthropic(apiKey, modelConfig.model, messages, temperature, maxTokens);
                break;
            case "deepseek":
                result = await callOpenAICompatible(
                    ENDPOINTS.deepseek, apiKey, modelConfig.model, messages, temperature, maxTokens,
                );
                break;
            case "xai":
                result = await callOpenAICompatible(
                    ENDPOINTS.xai, apiKey, modelConfig.model, messages, temperature, maxTokens,
                );
                break;
            case "alibaba":
                result = await callOpenAICompatible(
                    ENDPOINTS.alibaba, apiKey, modelConfig.model, messages, temperature, maxTokens,
                );
                break;
            default:
                return respond({ error: `Provider "${modelConfig.provider}" not supported` }, 400);
        }

        console.log(`[AI] ${modelId} -> ${user.email} | ${Date.now() - startTime}ms`);

        return respond(
            {
                ...result,
                modelId,
                provider: modelConfig.provider,
                latency: Date.now() - startTime,
            },
            200,
        );
    } catch (err) {
        console.error("[AI Chat] Error:", err);
        return respond(
            { error: err instanceof Error ? err.message : "Internal error" },
            500,
        );
    }
});
