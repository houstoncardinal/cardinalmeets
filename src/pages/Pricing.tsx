import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TIERS, TierKey } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, currentTier, createCheckout, loading } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleSubscribe = async (tierKey: TierKey) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(tierKey);
    try {
      await createCheckout(TIERS[tierKey].price_id);
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const tierOrder: TierKey[] = ["starter", "professional", "enterprise"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Plans for every organization
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Start free, scale as you grow. All plans include a 14-day trial.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {tierOrder.map((tierKey) => {
            const tier = TIERS[tierKey];
            const isPopular = tierKey === "professional";
            const isCurrent = currentTier === tierKey;

            return (
              <Card
                key={tierKey}
                className={`relative flex flex-col ${
                  isPopular
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Your Plan</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-8 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    size="lg"
                    disabled={isCurrent || loading || checkoutLoading === tierKey}
                    onClick={() => handleSubscribe(tierKey)}
                  >
                    {checkoutLoading === tierKey ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrent ? "Current Plan" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
