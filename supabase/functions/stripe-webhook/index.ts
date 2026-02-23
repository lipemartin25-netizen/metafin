import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Helper: buscar profile por stripe_customer_id
async function getProfileByCustomer(
    supabase: ReturnType<typeof createClient>,
    customerId: string
) {
    const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
    return data;
}

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return new Response("Missing stripe-signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await req.text();
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        );
    } catch (err) {
        console.error("[Webhook] ❌ Signature verification failed:", err);
        return new Response(
            JSON.stringify({
                error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}`,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Webhook] 📨 ${event.type} (${event.id})`);

    try {
        switch (event.type) {
            // ===== CHECKOUT COMPLETADO =====
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (!userId || !subscriptionId) {
                    console.warn("[Webhook] ⚠️ Missing userId or subscriptionId");
                    break;
                }

                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                const { error } = await supabase
                    .from("profiles")
                    .update({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        subscription_status: subscription.status,
                        subscription_price_id:
                            subscription.items.data[0]?.price.id || null,
                        subscription_current_period_end: new Date(
                            subscription.current_period_end * 1000
                        ).toISOString(),
                    })
                    .eq("id", userId);

                if (error) {
                    console.error("[Webhook] ❌ DB update failed:", error.message);
                } else {
                    console.log(
                        `[Webhook] ✅ ${userId} → ${subscription.status}`
                    );
                }
                break;
            }

            // ===== ASSINATURA ATUALIZADA =====
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const profile = await getProfileByCustomer(
                    supabase,
                    subscription.customer as string
                );

                if (profile) {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_status: subscription.status,
                            subscription_price_id:
                                subscription.items.data[0]?.price.id || null,
                            subscription_current_period_end: new Date(
                                subscription.current_period_end * 1000
                            ).toISOString(),
                        })
                        .eq("id", profile.id);

                    console.log(
                        `[Webhook] 🔄 ${profile.id} → ${subscription.status}`
                    );
                }
                break;
            }

            // ===== ASSINATURA CANCELADA =====
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const profile = await getProfileByCustomer(
                    supabase,
                    subscription.customer as string
                );

                if (profile) {
                    await supabase
                        .from("profiles")
                        .update({
                            subscription_status: "canceled",
                            stripe_subscription_id: null,
                            subscription_price_id: null,
                        })
                        .eq("id", profile.id);

                    console.log(`[Webhook] ❌ ${profile.id} → canceled`);
                }
                break;
            }

            // ===== PAGAMENTO SUCESSO =====
            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const profile = await getProfileByCustomer(
                    supabase,
                    invoice.customer as string
                );

                if (profile && invoice.amount_paid > 0) {
                    await supabase.from("payments").insert({
                        user_id: profile.id,
                        stripe_invoice_id: invoice.id,
                        stripe_payment_intent_id:
                            (invoice.payment_intent as string) || null,
                        amount: invoice.amount_paid / 100,
                        currency: invoice.currency || "brl",
                        status: "succeeded",
                        description: `MetaFin Pro — ${new Date().toLocaleDateString("pt-BR")}`,
                    });

                    console.log(
                        `[Webhook] 💰 R$ ${(invoice.amount_paid / 100).toFixed(2)} → ${profile.id}`
                    );
                }
                break;
            }

            // ===== PAGAMENTO FALHOU =====
            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const profile = await getProfileByCustomer(
                    supabase,
                    invoice.customer as string
                );

                if (profile) {
                    await supabase
                        .from("profiles")
                        .update({ subscription_status: "past_due" })
                        .eq("id", profile.id);

                    await supabase.from("payments").insert({
                        user_id: profile.id,
                        stripe_invoice_id: invoice.id,
                        amount: (invoice.amount_due || 0) / 100,
                        currency: invoice.currency || "brl",
                        status: "failed",
                        description: "Pagamento falhou — verifique o cartão",
                    });

                    console.log(`[Webhook] ⚠️ FAILED → ${profile.id}`);
                }
                break;
            }

            default:
                console.log(`[Webhook] ℹ️ Ignored: ${event.type}`);
        }
    } catch (err) {
        console.error(`[Webhook] ❌ Handler error for ${event.type}:`, err);
        // Retornamos 200 mesmo com erro de handler para evitar re-delivery infinito
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
});
