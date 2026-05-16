"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

const PricingPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email ?? null);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col items-center justify-center p-4 py-12">
      <div className="flex flex-col items-center text-center max-w-xl mb-10 gap-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground">
          Start for free, or upgrade to Pro for unlimited meetings and AI agents.
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <Script async src="https://js.stripe.com/v3/pricing-table.js" strategy="lazyOnload" />

        {userId &&
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
          process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID && (
          <div className="w-full">
            {React.createElement("stripe-pricing-table", {
              "pricing-table-id": process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID,
              "publishable-key": process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
              "client-reference-id": userId,
              "customer-email": userEmail ?? undefined,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
