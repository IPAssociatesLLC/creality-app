import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_MAP: Record<string, string> = {
  "byok_monthly": "price_1TjVUQLkrv8CqVuueA7IAesQ",
  "byok_annual": "price_1TjVUQLkrv8CqVuucg46ijYb",
  "pro_monthly": "price_1TjVWlLkrv8CqVuudk0WcLNd",
  "pro_annual": "price_1TjVWlLkrv8CqVuuhkgws3FI",
  "team_monthly": "price_1TjVXYLkrv8CqVuurmCqLwng",
  "team_annual": "price_1TjVXYLkrv8CqVuueyB1pV18",
  "hosting_monthly": "price_1TjYrsLkrv8CqVuu2310YD3T",
  "hosting_annual": "price_1TjYrsLkrv8CqVuuqpJTNgV4",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { planId, billingPeriod, successUrl, cancelUrl } = body;

    if (!planId || !billingPeriod) {
      return new Response(JSON.stringify({ error: "Missing planId or billingPeriod" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceKey = `${planId}_${billingPeriod}`;
    const priceId = PRICE_MAP[priceKey];

    if (!priceId) {
      return new Response(JSON.stringify({ 
        error: `No price configured for ${planId} (${billingPeriod}). Please check your Stripe product setup.`,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-06-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { data: userPlan } = await supabaseAdmin
      .from("user_plans")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = userPlan?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("user_plans")
        .upsert({ user_id: user.id, stripe_customer_id: customerId, email: user.email }, { onConflict: "user_id" });
    }

    const origin = req.headers.get("origin") || "https://creaility.com";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl || `${origin}/workspace?checkout=success`,
      cancel_url: cancelUrl || `${origin}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_period: billingPeriod,
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("Stripe checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});