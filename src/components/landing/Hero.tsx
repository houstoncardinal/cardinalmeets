import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Users, Shield, Zap, ArrowRight } from "lucide-react";
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
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Enterprise-grade video conferencing
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Connect, collaborate,
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              anywhere
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Crystal-clear video meetings for teams of all sizes. Secure,
            reliable, and packed with powerful collaboration tools.
          </p>

          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 md:flex-row">
            <Button
              size="lg"
              onClick={handleNewMeeting}
              className="w-full gap-2 md:w-auto"
            >
              <Video className="h-5 w-5" />
              New Meeting
            </Button>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <Input
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
                placeholder="Enter meeting code"
                className="h-11 md:w-64"
              />
              <Button
                variant="secondary"
                size="lg"
                onClick={handleJoinMeeting}
                className="shrink-0 gap-2"
              >
                Join
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm">Up to 500 participants</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">HD video & audio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
