import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TIERS = {
  starter: {
    product_id: "prod_Tz78qD555gOfmK",
    price_id: "price_1T18ugD8hDIMEHXbPaNnZFqT",
    name: "Starter",
    price: 19,
    features: [
      "Up to 50 participants",
      "HD video quality",
      "Screen sharing",
      "Chat messaging",
      "30-min meetings",
      "Email support",
    ],
  },
  professional: {
    product_id: "prod_Tz79zKAsTvrMjU",
    price_id: "price_1T18uuD8hDIMEHXbwlNUifip",
    name: "Professional",
    price: 49,
    features: [
      "Up to 200 participants",
      "4K video quality",
      "AI meeting summaries",
      "Cloud recording",
      "Breakout rooms",
      "Real-time transcription",
      "Custom backgrounds",
      "Priority support",
    ],
  },
  enterprise: {
    product_id: "prod_Tz7AiyuTXvgNCE",
    price_id: "price_1T18voD8hDIMEHXb01iAYNKD",
    name: "Enterprise",
    price: 99,
    features: [
      "Unlimited participants",
      "Custom branding",
      "SSO integration",
      "Dedicated account manager",
      "SLA guarantee (99.99%)",
      "Advanced analytics",
      "API access",
      "On-premise option",
    ],
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function useSubscription() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentTier: TierKey | null = productId
    ? (Object.entries(TIERS).find(([, t]) => t.product_id === productId)?.[0] as TierKey) ?? null
    : null;

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data.subscribed);
      setProductId(data.product_id);
      setSubscriptionEnd(data.subscription_end);
    } catch (err) {
      console.error("Failed to check subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  return {
    subscribed,
    productId,
    currentTier,
    subscriptionEnd,
    loading,
    checkSubscription,
    createCheckout,
    openPortal,
  };
}
