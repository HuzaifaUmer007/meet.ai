import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // For local testing if secret is not set, we bypass signature verification
      // WARNING: In production, always verify the webhook signature
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // The client_reference_id contains the Supabase user.id
    const userId = session.client_reference_id;

    if (userId) {
      const supabase = createAdminClient();
      
      // Update the user's metadata to grant them "Pro" status and save customer ID
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { 
          plan: "Pro",
          stripe_customer_id: session.customer as string
        },
      });

      if (error) {
        console.error("Failed to update user plan:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to Pro plan.`);
    }
  }

  return NextResponse.json({ status: "ok" });
}
