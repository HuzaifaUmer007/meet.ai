import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10" as any, // Using latest stable version
  appInfo: {
    name: "Meet.AI",
    version: "0.1.0",
  },
});
