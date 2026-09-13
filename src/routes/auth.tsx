import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wrench, Loader2, Clock, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginFn, registerFn } from "@/lib/api/auth";

type StoredStatus = { email: string; status: "pending" | "rejected"; reason?: string; at: string };
const STATUS_KEY = "rk_signup_status";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — RK Repair Labs" },
      {
        name: "description",
        content:
          "Sign in to the RK Repair Labs shop dashboard, or create a customer or employee account to get started.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [requestedRole, setRequestedRole] = useState<"customer" | "employee">("customer");
  const [stored, setStored] = useState<StoredStatus | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATUS_KEY);
      if (raw) setStored(JSON.parse(raw));
    } catch {}
  }, []);

  if (!loading && user) return <Navigate to="/management/dashboard" replace />;

  function persistStatus(next: StoredStatus | null) {
    setStored(next);
    if (next) localStorage.setItem(STATUS_KEY, JSON.stringify(next));
    else localStorage.removeItem(STATUS_KEY);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setAuthError("");
    try {
      const res = await loginFn({ data: { email, password } });
      if (res && "error" in res) {
        setBusy(false);
        setAuthError(res.error);
        return;
      }
      setBusy(false);
      toast.success("Welcome back");
      window.location.href = "/management/dashboard";
    } catch (error: any) {
      setBusy(false);
      setAuthError(error.message || "Invalid credentials");
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setAuthError("");
    try {
      const res = await registerFn({ data: { email, password, fullName, requestedRole } });
      setBusy(false);
      if (res.status === "approved") {
        persistStatus(null);
        toast.success("Shop admin account created");
        window.location.href = "/management/dashboard";
        return;
      }
      persistStatus({ email, status: "pending", at: new Date().toISOString() });
      toast.success("Account created — waiting for admin approval");
    } catch (error: any) {
      setBusy(false);
      setAuthError(error.message || "Failed to create account");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-glow)" }}
      />
      <main className="container relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Wrench className="h-5 w-5 text-background" />
          </div>
          <span className="text-lg font-bold">RK Labs</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-8 shadow-[var(--shadow-glow)]"
        >
          <h1 className="text-2xl font-bold">Repair Management System</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your shop dashboard.</p>

          {stored && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border p-3 text-sm ${
                stored.status === "pending"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
            >
              {stored.status === "pending" ? (
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {stored.status === "pending" ? "Pending admin approval" : "Signup rejected"}
                </div>
                <div className="mt-0.5 text-xs opacity-90">
                  {stored.email}
                  {stored.status === "rejected" && stored.reason ? ` · ${stored.reason}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => persistStatus(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4 pt-4">
                {authError && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <p>{authError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full"
                  style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                </Button>
                {process.env.NODE_ENV !== "production" && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Mock DB: any email, pass: Password123!
                  </p>
                )}
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4 pt-4">
                {authError && (
                  <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <p>{authError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["customer", "employee"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRequestedRole(r)}
                        className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                          requestedRole === r
                            ? "border-[var(--neon)]/60 bg-[var(--neon)]/10 text-[var(--neon)]"
                            : "border-white/10 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Password</Label>
                  <div className="relative">
                    <Input
                      id="pw2"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full"
                  style={{ background: "var(--gradient-primary)", color: "oklch(0.12 0.02 250)" }}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  New accounts require admin approval before sign-in. The very first account created
                  on this shop becomes the admin.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
