import { Button } from "@/components/ui/button";
import { Video, Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Enterprise", href: "#enterprise" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MeetFlow</span>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
              <Button onClick={() => navigate("/auth")}>Get Started Free</Button>
            </>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <nav className="mt-8 flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-lg font-medium text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate("/dashboard");
                      setIsOpen(false);
                    }}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigate("/auth");
                        setIsOpen(false);
                      }}
                    >
                      Sign in
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        navigate("/auth");
                        setIsOpen(false);
                      }}
                    >
                      Get Started Free
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
