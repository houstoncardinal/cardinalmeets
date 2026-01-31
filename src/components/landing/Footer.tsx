import { Video } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Enterprise", "Security", "Integrations"],
  Company: ["About", "Careers", "Blog", "Press", "Partners"],
  Resources: ["Help Center", "Community", "Webinars", "Developers", "Status"],
  Legal: ["Privacy", "Terms", "Cookie Policy", "GDPR", "Accessibility"],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                MeetFlow
              </span>
            </a>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              Enterprise-grade video conferencing for teams of all sizes.
              Connect, collaborate, anywhere.
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MeetFlow. All rights reserved.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                {category}
              </h4>
              <ul className="space-y-2">
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
      </div>
    </footer>
  );
}
