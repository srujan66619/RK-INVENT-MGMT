import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { CustomerLayout } from "@/components/customer-layout";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customer")({
  ssr: false,
  component: CustomerGate,
});

function CustomerGate() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#020617]">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Basic RBAC check for UI level - actual protection is on the API
  if (user.role !== "customer" && user.role !== "admin") {
    return (
      <CustomerLayout>
        <div className="flex-1 flex items-center justify-center p-6 h-full">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-100">Access Denied</h1>
              <p className="text-slate-400">
                You do not have the required permissions to view the customer portal.
              </p>
            </div>
            
            <Button 
              variant="default"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
}
