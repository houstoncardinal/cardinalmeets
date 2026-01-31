const stats = [
  { value: "50M+", label: "Monthly users" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "180+", label: "Countries" },
  { value: "5B+", label: "Meeting minutes" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-primary py-16">
      <div className="container px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary-foreground md:text-5xl">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-primary-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
