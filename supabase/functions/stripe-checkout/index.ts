import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
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

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return respond({ error: "Method not allowed" }, 405);
    }

    try {
        // 1. Autenticar
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return respond({ error: "Authorization required" }, 401);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return respond({ error: "Não autorizado. Faça login novamente." }, 401);
        }

        // 2. Body
        const { priceId, successUrl, cancelUrl } = await req.json();
        if (!priceId) return respond({ error: "priceId é obrigatório" }, 400);

        // 3. Buscar/criar Stripe Customer
        const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id, full_name")
            .eq("id", user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            console.log(`[Checkout] Criando customer para ${user.email}`);
            const customer = await stripe.customers.create({
                email: user.email!,
                name: profile?.full_name || undefined,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;

            await supabase
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        // 4. Criar Checkout Session
        const origin = req.headers.get("origin") || "http://localhost:5173";

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl || `${origin}/app?checkout=success`,
            cancel_url: cancelUrl || `${origin}/app?checkout=canceled`,
            subscription_data: {
                trial_period_days: 7,
                metadata: { supabase_user_id: user.id },
            },
            allow_promotion_codes: true,
            billing_address_collection: "auto",
            locale: "pt-BR",
            metadata: { supabase_user_id: user.id },
        });

        console.log(`[Checkout] ✅ Session ${session.id} → ${user.email}`);
        return respond({ url: session.url, sessionId: session.id }, 200);
    } catch (err) {
        console.error("[Checkout] ❌", err);
        return respond(
            { error: err instanceof Error ? err.message : "Erro interno" },
            500
        );
    }
});
