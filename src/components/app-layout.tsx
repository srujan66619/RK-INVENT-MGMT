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
  Search,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { WaSenderProvider } from "@/components/wa-sender";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { meFn, logoutFn } from "@/lib/api/auth";
import { getNotificationsFn, markNotificationsReadFn } from "@/lib/api/notifications";
import { GlobalSearch, openGlobalSearch } from "@/components/global-search";

const NAV = [
  { to: "/management/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/staff/customers", label: "Customers", icon: Users, group: "Operations" },
  { to: "/staff/repairs", label: "Repairs", icon: Wrench, group: "Operations" },
  { to: "/inventory/dashboard", label: "Inventory", icon: Boxes, group: "Supply Chain" },
  { to: "/inventory/suppliers", label: "Suppliers", icon: Truck, group: "Supply Chain" },
  { to: "/finance/billing", label: "Billing", icon: Receipt, group: "Finance" },
  { to: "/manager/reports", label: "Reports", icon: BarChart3, group: "Finance" },
  { to: "/finance/pnl", label: "Profit & Loss", icon: Calculator, group: "Finance" },
  { to: "/manager/approvals", label: "Approvals", icon: UserCheck, adminOnly: true, group: "Admin" },
  { to: "/admin/settings", label: "Settings", icon: Settings, group: "Admin" },
] as const;

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

  const visibleNav = NAV.filter((n) => !("adminOnly" in n && n.adminOnly) || isAdmin);

  // Grouping logic for clean hierarchy
  const grouped = visibleNav.reduce((acc, item) => {
    const g = item.group || "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, typeof visibleNav>);

  return (
    <nav className={cn("flex flex-col gap-6 p-4", collapsed ? "items-center" : "")}>
      {Object.entries(grouped).map(([groupName, items]) => (
        <div key={groupName} className="flex flex-col gap-1.5 w-full">
          {!collapsed && (
            <div className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {groupName}
            </div>
          )}
          {collapsed && <div className="h-4" />} {/* Spacer for collapsed mode */}
          
          {items.map((item) => {
            const active = path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClick}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg py-2.5 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group",
                  collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3 w-full",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:translate-x-1"
                )}
              >
                {active && !collapsed && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <item.icon
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    collapsed ? "h-5 w-5" : "h-4 w-4",
                    active ? "text-primary scale-110" : "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex h-[64px] items-center px-6 pt-2 pb-2 border-b border-border/50", collapsed && "justify-center px-2")}>
      <Link to="/management/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Logo className={cn("w-auto transition-all duration-300", collapsed ? "h-8" : "h-10")} />
      </Link>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
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
      <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 font-sans">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-border bg-card md:flex transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] h-full z-20 shadow-sm",
            collapsed ? "w-[80px]" : "w-64",
          )}
        >
          <SidebarBrand collapsed={collapsed} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <NavLinks collapsed={collapsed} />
          </div>
          <div className="shrink-0 border-t border-border p-4 flex flex-col gap-2 mt-auto">
            <Button
              variant="ghost"
              className={cn(
                "justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200",
                collapsed ? "px-0 justify-center h-11 w-11 mx-auto" : "w-full",
              )}
              onClick={signOut}
              title={collapsed ? "Sign out" : undefined}
            >
              <LogOut className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />{" "}
              {!collapsed && "Sign out"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden relative">
          {/* Header */}
          <header className="shrink-0 flex h-16 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl px-4 sm:px-6 z-10 shadow-sm">
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
                className="w-72 border-r border-border bg-card p-0 flex flex-col h-full"
              >
                <SidebarBrand />
                <div className="flex-1 overflow-y-auto">
                  <NavLinks onClick={() => setOpen(false)} />
                </div>
                <div className="shrink-0 border-t border-border p-4 mt-auto">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
              className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              onClick={toggleSidebar}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 max-w-xl ml-2">
              <Button
                variant="outline"
                className="w-full justify-start text-sm text-muted-foreground bg-accent/30 border-border hover:bg-accent/50 hover:text-foreground hover:border-border/80 transition-all duration-200 shadow-sm h-10 px-4"
                onClick={openGlobalSearch}
              >
                <Search className="mr-3 h-4 w-4" />
                Search tickets, customers...
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationsBell />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={signOut}
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content with Page Transitions */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-background relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="p-4 sm:p-6 md:p-8 min-h-full"
              >
                <div className="mx-auto w-full max-w-[1400px]">
                  {children}
                </div>
              </motion.div>
            </AnimatePresence>
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
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      {/* Modern dropdown animation using Tailwind built-ins from Radix UI */}
      <PopoverContent align="end" className="w-80 p-0 border border-border shadow-elevated rounded-xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 transition-all duration-200">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Notifications</div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 opacity-20" />
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
                    "flex gap-4 border-b border-border/50 px-4 py-4 last:border-0 hover:bg-accent/30 transition-colors duration-200 cursor-default",
                    !n.read_at && "bg-primary/5",
                  )}
                >
                  <div className={cn(
                    "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isApproved ? "bg-success/10 text-success" : 
                    isRejected ? "bg-destructive/10 text-destructive" : 
                    "bg-primary/10 text-primary"
                  )}>
                    {isApproved ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isRejected ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{n.title}</div>
                    {n.body && <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{n.body}</div>}
                    <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
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
