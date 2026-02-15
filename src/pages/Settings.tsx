import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, CreditCard, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, currentTier, subscriptionEnd, openPortal, loading } = useSubscription();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const userInitials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user!.id);

      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openPortal();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const tierInfo = currentTier ? TIERS[currentTier] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="mb-8 text-3xl font-bold text-foreground">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.user_metadata?.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subscribed && tierInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{tierInfo.name}</h3>
                          <Badge>Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${tierInfo.price}/month
                          {subscriptionEnd && ` · Renews ${new Date(subscriptionEnd).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleOpenPortal} disabled={portalLoading}>
                        {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Manage
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4 text-muted-foreground">You don't have an active subscription</p>
                    <Button onClick={() => navigate("/pricing")}>View Plans</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <h3 className="font-medium text-foreground">Password</h3>
                    <p className="text-sm text-muted-foreground">Change your account password</p>
                  </div>
                  <Button variant="outline" onClick={handleChangePassword}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
