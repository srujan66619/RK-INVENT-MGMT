import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Menu,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function PublicHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="RK Repair Labs"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-border bg-secondary"
          />
          <div className="hidden sm:block">
            <div className="text-base md:text-lg font-bold tracking-tight text-white leading-none">
              RK Repair Labs
            </div>
            <div className="text-[10px] md:text-xs uppercase tracking-widest text-primary font-semibold mt-1">
              Repair System
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary relative py-2",
                path === link.to ? "text-primary" : "text-muted-foreground",
              )}
            >
              {link.label}
              {path === link.to && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/track" className="hidden sm:inline-flex">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-semibold">
              Track Repair
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="shadow-[var(--shadow-neon)] transition-transform hover:-translate-y-0.5 bg-[var(--neon)] text-black font-bold">
              Sign In
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-80 border-l border-border/50 bg-card p-0 flex flex-col h-full"
            >
              <div className="p-6 border-b border-border/50 flex items-center gap-3">
                <img src="/logo.png" alt="RK Repair Labs" className="h-10 w-10 rounded-full" />
                <div>
                  <div className="text-lg font-bold text-white">RK Repair Labs</div>
                  <div className="text-xs uppercase text-primary">Repair System</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl text-base font-semibold transition-all",
                      path === link.to
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                ))}
                <Link
                  to="/track"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl text-base font-semibold text-muted-foreground hover:bg-secondary transition-all mt-4 border border-border"
                >
                  Track Repair
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border/50 bg-card pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="RK Repair Labs"
                className="h-12 w-12 rounded-full border border-border bg-secondary"
              />
              <div>
                <div className="text-xl font-bold tracking-tight text-white leading-none">
                  RK Repair Labs
                </div>
                <div className="text-xs uppercase tracking-widest text-primary font-semibold mt-1">
                  Repair System
                </div>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Expert laptop and mobile repair services in Guntur. 11+ years of experience in
              chip-level repairs, screen replacement, and software solutions.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/919666984949"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-[#25D366] hover:text-foreground transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <ChevronRight className="h-3 w-3" /> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Our Services</h3>
            <ul className="space-y-4">
              <li className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Laptop Chip-Level Repair
              </li>
              <li className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> iPhone & Mobile Repair
              </li>
              <li className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Screen Replacement
              </li>
              <li className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Dead Condition Recovery
              </li>
              <li className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Software Solutions
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm leading-relaxed">
                  14-13, Brindavan Gardens 1st Ln, Brindavan Gardens, Guntur, AP 522004
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <a
                  href="tel:+919666984949"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  +91 96669 84949
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <a
                  href="mailto:info@rkrepairlabs.com"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  info@rkrepairlabs.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <span className="text-muted-foreground text-sm">Mon - Sat: 10:00 AM - 8:30 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} RK Repair Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/track"
              className="text-muted-foreground hover:text-muted-foreground text-xs font-medium transition-colors"
            >
              Track Repair
            </Link>
            <Link
              to="/auth"
              className="text-muted-foreground hover:text-muted-foreground text-xs font-medium transition-colors"
            >
              Admin Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 font-sans">
      <PublicHeader />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <PublicFooter />
    </div>
  );
}
