import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/finance")({
  ssr: false,
  component: FinanceGate,
});

function FinanceGate() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const allowedRoles = ["admin", "manager", "finance"];
  if (!allowedRoles.includes(user.role)) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-6 h-full">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="text-muted-foreground">
                You do not have the required permissions to view the finance portal.
              </p>
            </div>
            
            <Button 
              variant="default"
              className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
