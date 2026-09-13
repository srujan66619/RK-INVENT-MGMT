import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Boxes,
  Receipt,
  Settings,
  LogOut,
  Menu,
  Bell,
  Truck,
  BarChart3,
  Calculator,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { WaSenderProvider } from "@/components/wa-sender";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/hooks/use-theme";
import { meFn, logoutFn } from "@/lib/api/auth";
import { getNotificationsFn, markNotificationsReadFn } from "@/lib/api/notifications";
import { GlobalSearch, openGlobalSearch } from "@/components/global-search";

const NAV = [
  { to: "/management/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff/customers", label: "Customers", icon: Users },
  { to: "/staff/repairs", label: "Repairs", icon: Wrench },
  { to: "/inventory/dashboard", label: "Inventory", icon: Boxes },
  { to: "/inventory/suppliers", label: "Suppliers", icon: Truck },
  { to: "/finance/billing", label: "Billing", icon: Receipt },
  { to: "/manager/reports", label: "Reports", icon: BarChart3 },
  { to: "/finance/pnl", label: "Profit & Loss", icon: Calculator },
  { to: "/manager/approvals", label: "Approvals", icon: UserCheck, adminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

function NavLinks({ onClick, collapsed }: { onClick?: () => void; collapsed?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { user } = await meFn();
        setIsAdmin(user?.role === "admin");
      } catch (e) {
        setIsAdmin(false);
      }
    })();
  }, []);
  return (
    <nav className={cn("flex flex-col gap-1 p-3", collapsed ? "items-center" : "")}>
      {NAV.filter((n) => !("adminOnly" in n && n.adminOnly) || isAdmin).map((item) => {
        const active = path.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2.5 text-sm transition-all",
              collapsed ? "justify-center px-0 w-10 h-10" : "px-3",
              active
                ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "shrink-0",
                collapsed ? "h-5 w-5" : "h-4 w-4",
                active && "text-primary",
              )}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        "flex items-center border-b border-border/50 py-5",
        collapsed ? "justify-center px-2" : "gap-3 px-5",
      )}
    >
      <img
        src="/logo.png"
        alt="RK Repair Labs"
        className={cn(
          "rounded-lg object-contain bg-secondary p-0.5 shrink-0",
          collapsed ? "h-8 w-8" : "h-10 w-10",
        )}
      />
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight text-foreground truncate">
            RK Repair Labs
          </div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Repair System
          </div>
        </div>
      )}
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rk-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("rk-sidebar-collapsed", String(next));
  }

  async function signOut() {
    await logoutFn();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <WaSenderProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-border/50 bg-card/95 backdrop-blur-md md:flex transition-all duration-300 ease-in-out h-full",
            collapsed ? "w-[72px]" : "w-64",
          )}
        >
          <SidebarBrand collapsed={collapsed} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <NavLinks collapsed={collapsed} />
          </div>
          <div className="shrink-0 border-t border-border p-3 flex flex-col gap-2 mt-auto">
            <Button
              variant="ghost"
              className={cn(
                "justify-start gap-2 text-muted-foreground hover:text-foreground",
                collapsed ? "px-0 justify-center h-10 w-10 mx-auto" : "w-full",
              )}
              onClick={signOut}
              title={collapsed ? "Sign out" : undefined}
            >
              <LogOut className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />{" "}
              {!collapsed && "Sign out"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <header className="shrink-0 flex h-14 items-center gap-2 border-b border-border/50 bg-card/80 backdrop-blur-md px-3 sm:px-4">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-r border-border/50 bg-card p-0 flex flex-col h-full"
              >
                <SidebarBrand />
                <div className="flex-1 overflow-y-auto">
                  <NavLinks onClick={() => setOpen(false)} />
                </div>
                <div className="shrink-0 border-t border-border p-3 mt-auto">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 shrink-0" /> Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-muted-foreground hover:text-foreground"
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 px-4 max-w-xl">
              <Button
                variant="outline"
                className="w-full justify-start text-sm text-muted-foreground bg-secondary border-border hover:bg-cardccent hover:text-foreground"
                onClick={openGlobalSearch}
              >
                <Search className="mr-2 h-4 w-4" />
                Search tickets, customers...
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            
            <div className="flex-1" />
            
            <ThemeToggle />
            <NotificationsBell />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={signOut}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 custom-scrollbar">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
      <GlobalSearch />
    </WaSenderProvider>
  );
}



type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

function NotificationsBell() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        return await getNotificationsFn();
      } catch (e) {
        return [] as Notif[];
      }
    },
    refetchInterval: 30_000,
  });
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    await markNotificationsReadFn({ data: ids });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Popover
      onOpenChange={(o) => {
        if (!o) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--neon)] px-1 text-[10px] font-bold text-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            items.map((n) => {
              const isApproved = n.kind.startsWith("approval_approved");
              const isRejected = n.kind.startsWith("approval_rejected");
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 border-b border-border/50 px-4 py-3 last:border-0",
                    !n.read_at && "bg-white/[0.03]",
                  )}
                >
                  {isApproved ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon)]" />
                  ) : isRejected ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {fmtDateTime(n.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
