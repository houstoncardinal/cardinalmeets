import {
  Video,
  Shield,
  Users,
  Monitor,
  MessageSquare,
  Calendar,
  Zap,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "HD Video & Audio",
    description:
      "Crystal-clear 1080p video and studio-quality audio for professional meetings.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "End-to-end encryption, SOC 2 compliance, and advanced admin controls.",
  },
  {
    icon: Users,
    title: "Large Meetings",
    description:
      "Host up to 500 participants with webinar mode for up to 10,000 viewers.",
  },
  {
    icon: Monitor,
    title: "Screen Sharing",
    description:
      "Share your entire screen, specific apps, or individual browser tabs.",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description:
      "In-meeting chat with file sharing, reactions, and threaded replies.",
  },
  {
    icon: Calendar,
    title: "Calendar Integration",
    description:
      "Seamless integration with Google Calendar, Outlook, and other tools.",
  },
  {
    icon: Zap,
    title: "AI Features",
    description:
      "Automatic transcription, noise cancellation, and smart meeting summaries.",
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description:
      "Low-latency connections worldwide with 99.99% uptime guarantee.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border bg-muted/30 py-20">
      <div className="container px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything you need for seamless meetings
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for modern teams and enterprises.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
