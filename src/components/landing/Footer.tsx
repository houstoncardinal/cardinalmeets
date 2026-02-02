const footerLinks = {
  Platform: ["Features", "Security", "Integrations", "API", "Mobile Apps"],
  Solutions: ["Enterprise", "Healthcare", "Financial Services", "Education", "Government"],
  Resources: ["Documentation", "Developer Hub", "Webinars", "Case Studies", "Status"],
  Company: ["About", "Careers", "Press", "Partners", "Contact"],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="/" className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 text-primary-foreground"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Cardinal
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Meets
                </span>
              </div>
            </a>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
              The premier enterprise video conferencing platform for
              organizations that demand excellence.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                SOC 2 Type II
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                HIPAA
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                GDPR
              </span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-5 text-sm font-semibold text-foreground">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cardinal Meets. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
