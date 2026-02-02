import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Play, Shield, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

export function Hero() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const handleNewMeeting = () => {
    const newMeetingId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    navigate(`/meeting/${newMeetingId}`);
  };

  const handleJoinMeeting = () => {
    if (!meetingCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }
    navigate(`/meeting/${meetingCode.trim()}`);
  };

  return (
    <section className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
      {/* Sophisticated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute left-1/4 top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-20 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="container px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-5 py-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                Trusted by Fortune 500 companies worldwide
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
              Where Leaders
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Connect
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-xl text-muted-foreground md:text-2xl">
              The premier enterprise video conferencing platform designed for
              organizations that demand excellence, security, and seamless
              collaboration.
            </p>

            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 md:flex-row md:justify-center">
              <Button
                size="lg"
                onClick={handleNewMeeting}
                className="h-14 gap-3 px-8 text-base"
              >
                <Play className="h-5 w-5" />
                Start Instant Meeting
              </Button>

              <div className="flex w-full items-center gap-3 md:w-auto">
                <Input
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
                  placeholder="Enter meeting code"
                  className="h-14 md:w-72 text-base"
                />
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleJoinMeeting}
                  className="h-14 shrink-0 gap-2 px-6"
                >
                  Join
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Lock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Global Infrastructure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
