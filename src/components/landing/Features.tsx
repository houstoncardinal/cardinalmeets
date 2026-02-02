import {
  Video,
  Shield,
  Users,
  Monitor,
  MessageSquare,
  Calendar,
  Cpu,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "4K Ultra HD Quality",
    description:
      "Cinematic video quality with adaptive bitrate streaming that adjusts seamlessly to network conditions.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Military-grade encryption, SSO integration, and comprehensive audit logs for complete compliance.",
  },
  {
    icon: Users,
    title: "Unlimited Scale",
    description:
      "Host meetings with up to 1,000 participants and webinars reaching 50,000 attendees.",
  },
  {
    icon: Monitor,
    title: "Advanced Sharing",
    description:
      "4K screen sharing with annotation tools, virtual whiteboards, and real-time collaboration.",
  },
  {
    icon: MessageSquare,
    title: "Integrated Workspace",
    description:
      "Persistent chat channels, file sharing, and threaded discussions that extend beyond meetings.",
  },
  {
    icon: Calendar,
    title: "Seamless Integration",
    description:
      "Native integration with Microsoft 365, Google Workspace, Salesforce, and 200+ enterprise tools.",
  },
  {
    icon: Cpu,
    title: "AI-Powered Insights",
    description:
      "Automatic transcription, real-time translation, intelligent summaries, and action item extraction.",
  },
  {
    icon: Globe,
    title: "Global Reliability",
    description:
      "Distributed infrastructure across 6 continents with automatic failover and 99.99% uptime.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container px-4">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            Platform Capabilities
          </p>
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Built for the most demanding organizations
          </h2>
          <p className="text-xl text-muted-foreground">
            Every feature engineered to meet the exacting standards of global
            enterprises.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
