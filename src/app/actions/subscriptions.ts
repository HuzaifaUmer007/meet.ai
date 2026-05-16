"use server";

import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function getUserPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const plan = user.user_metadata?.plan || "Free";

  return {
    plan, // "Free" or "Pro"
    maxMeetings: plan === "Pro" ? 15 : 10,
    maxAgents: plan === "Pro" ? 20 : 5,
  };
}

export async function createCheckoutSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  // We are creating a simple one-time payment for testing, or subscription
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment", // "subscription" would require setting up a product in Stripe dashboard first
    client_reference_id: user.id,
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Meet.AI Pro",
            description: "Unlimited Meetings and Agents",
          },
          unit_amount: 1900, // $19.00
        },
        quantity: 1,
      },
    ],
    success_url: `${(await headers()).get("origin")}/meetings?success=true`,
    cancel_url: `${(await headers()).get("origin")}/pricing?canceled=true`,
  });

  return { url: session.url };
}

export async function getUserUsage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const planInfo = await getUserPlan();

  return {
    ...planInfo,
    meetings: user.user_metadata?.total_meetings_created || 0,
    agents: user.user_metadata?.total_agents_created || 0,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      stripe_customer_id: user.user_metadata?.stripe_customer_id,
    }
  };
}

export async function createCustomerPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let customerId = user.user_metadata?.stripe_customer_id;

  // Fallback: If no customer ID in metadata, search by email
  if (!customerId) {
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  if (!customerId) {
    throw new Error("No active subscription found. Please contact support.");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${(await headers()).get("origin")}/pricing`,
  });

  return { url: portalSession.url };
}
