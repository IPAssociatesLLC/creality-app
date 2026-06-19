import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

    if (!stripeSecretKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature") || "";
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const billingPeriod = session.metadata?.billing_period;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && planId) {
          const planCredits: Record<string, number> = {
            free: 50,
            pro: 500,
            byok: 0,
            hosting: 0,
          };
          const planBuilds: Record<string, number> = {
            free: 20,
            pro: 500,
            byok: 9999,
            hosting: 0,
          };
          const planProjects: Record<string, number> = {
            free: 3,
            pro: 999,
            byok: 999,
            hosting: 10,
          };

          await supabaseAdmin
            .from("user_plans")
            .upsert({
              user_id: userId,
              plan_tier: planId,
              status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              billing_period: billingPeriod,
              credits_remaining: planCredits[planId] || 50,
              credits_monthly: planCredits[planId] || 50,
              builds_used_this_month: 0,
              builds_limit_monthly: planBuilds[planId] || 20,
              projects_limit: planProjects[planId] || 3,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          console.log(`User ${userId} subscribed to ${planId} (${billingPeriod})`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const { data: userPlan } = await supabaseAdmin
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (userPlan) {
          const newStatus = status === "active" ? "active" : status === "past_due" ? "past_due" : "inactive";
          await supabaseAdmin
            .from("user_plans")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("user_id", userPlan.user_id);

          console.log(`Subscription updated for user ${userPlan.user_id}: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { data: userPlan } = await supabaseAdmin
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (userPlan) {
          await supabaseAdmin
            .from("user_plans")
            .update({
              plan_tier: "free",
              status: "active",
              credits_remaining: 50,
              credits_monthly: 50,
              builds_used_this_month: 0,
              builds_limit_monthly: 20,
              projects_limit: 3,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userPlan.user_id);

          console.log(`Subscription deleted for user ${userPlan.user_id}, reverted to free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const { data: userPlan } = await supabaseAdmin
          .from("user_plans")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (userPlan) {
          await supabaseAdmin
            .from("user_plans")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userPlan.user_id);

          console.log(`Payment failed for user ${userPlan.user_id}`);
        }
        break;
      }

      // Events we don't need to process but must acknowledge
      case "product.created":
      case "product.updated":
      case "product.deleted":
      case "price.created":
      case "price.updated":
      case "price.deleted":
      case "plan.created":
      case "plan.updated":
      case "plan.deleted":
      case "customer.created":
      case "customer.updated":
        // These are Stripe configuration events — acknowledge but don't process
        console.log(`Acknowledged: ${event.type}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Stripe webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});