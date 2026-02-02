import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTA() {
  const navigate = useNavigate();

  const handleNewMeeting = () => {
    const newMeetingId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    navigate(`/meeting/${newMeetingId}`);
  };

  return (
    <section className="py-24 md:py-32">
      <div className="container px-4">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary p-12 text-center md:p-20">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
          <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-primary-foreground/10 blur-3xl" />

          <div className="relative z-10">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary-foreground/80">
              Experience the difference
            </p>
            <h2 className="mb-6 text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
              Elevate your enterprise
              <br />
              communications
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-primary-foreground/80">
              Join the world's leading organizations who trust Cardinal Meets
              for their most critical communications.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleNewMeeting}
                className="h-14 gap-3 px-8 text-base"
              >
                <Calendar className="h-5 w-5" />
                Schedule a Demo
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-14 gap-3 px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Contact Sales
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
