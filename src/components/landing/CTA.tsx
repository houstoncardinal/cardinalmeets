import { Button } from "@/components/ui/button";
import { ArrowRight, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTA() {
  const navigate = useNavigate();

  const handleNewMeeting = () => {
    const newMeetingId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    navigate(`/meeting/${newMeetingId}`);
  };

  return (
    <section className="py-20">
      <div className="container px-4">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 text-center md:p-16">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to transform your meetings?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
              Join millions of teams already using MeetFlow for seamless
              collaboration.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleNewMeeting}
                className="gap-2"
              >
                <Video className="h-5 w-5" />
                Start Free Today
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Contact Sales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
