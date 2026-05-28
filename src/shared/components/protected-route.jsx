import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/authStore.js";
import { ShieldAlert } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Attempt to restore session on page mount
    if (isAuthenticated && !user && !isLoading) {
      initialize();
    }
  }, [isAuthenticated, user, isLoading, initialize]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, saving original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user profile is not fetched yet, wait
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Akses Ditolak</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Anda tidak memiliki izin yang cukup untuk mengakses halaman ini. Halaman ini memerlukan salah satu peran: {allowedRoles.join(", ")}.
        </p>
      </div>
    );
  }

  return children;
}
