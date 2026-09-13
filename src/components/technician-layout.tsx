import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Wrench, CheckCircle2, LogOut, Sun, Moon, Menu, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { logoutFn } from "@/lib/api/auth";
import { GlobalSearch, openGlobalSearch } from "@/components/global-search";

const NAV = [
  { to: "/technician/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/technician/jobs", label: "My Jobs", icon: Wrench },
] as const;

function NavLinks({ onClick }: { onClick?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = path.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm transition-all",
              active
                ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )}
          >
            <item.icon className={cn("shrink-0 h-4 w-4", active && "text-cyan-400")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center border-b border-white/5 py-5 gap-3 px-5">
      <img src="/logo.png" alt="RK Repair Labs" className="rounded-lg object-contain bg-white/5 p-0.5 shrink-0 h-10 w-10" />
      <div className="min-w-0">
        <div className="text-sm font-bold tracking-tight text-slate-100 truncate">
          RK Repair Labs
        </div>
        <div className="text-[10px] uppercase tracking-wider text-cyan-500 font-semibold">
          Technician Portal
        </div>
      </div>
    </div>
  );
}

export function TechnicianLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  async function signOut() {
    await logoutFn();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200 selection:bg-cyan-500/30">
      <aside className="hidden shrink-0 flex-col border-r border-white/10 bg-[#0f172a]/95 backdrop-blur-md md:flex w-64">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <NavLinks />
        </div>
        <div className="shrink-0 border-t border-white/10 p-3 flex flex-col gap-2 mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-slate-100" onClick={signOut}>
            <LogOut className="shrink-0 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <header className="shrink-0 flex h-14 items-center gap-2 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md px-3 sm:px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-r border-white/10 bg-[#0f172a] p-0 flex flex-col h-full">
              <SidebarBrand />
              <div className="flex-1 overflow-y-auto">
                <NavLinks onClick={() => setOpen(false)} />
              </div>
              <div className="shrink-0 border-t border-white/10 p-3 mt-auto">
                <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-slate-100" onClick={signOut}>
                  <LogOut className="h-4 w-4 shrink-0" /> Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 px-4 max-w-xl">
            <Button
              variant="outline"
              className="w-full justify-start text-sm text-muted-foreground bg-white/5 border-white/10 hover:bg-white/10 hover:text-slate-200"
              onClick={openGlobalSearch}
            >
              <Search className="mr-2 h-4 w-4" />
              Search tickets, customers...
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          <div className="flex-1" />
          
          <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
