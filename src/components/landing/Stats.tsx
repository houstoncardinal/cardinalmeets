const stats = [
  { value: "500+", label: "Enterprise Clients", suffix: "" },
  { value: "99.99", label: "Uptime SLA", suffix: "%" },
  { value: "180+", label: "Countries Served", suffix: "" },
  { value: "10B+", label: "Minutes Hosted", suffix: "" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-muted/30 py-20">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Trusted by industry leaders
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-3 text-5xl font-bold text-foreground md:text-6xl">
                {stat.value}
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
