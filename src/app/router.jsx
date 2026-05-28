import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/shared/layouts/dashboard-layout.jsx";
import { ProtectedRoute } from "@/shared/components/protected-route.jsx";

// Lazy Pages
const DashboardPage = lazy(() => import("@/pages/dashboard-page.jsx"));
const LoginPage = lazy(() => import("@/pages/login.jsx"));
const ProductsPage = lazy(() => import("@/pages/products-page.jsx"));
const StoresPage = lazy(() => import("@/pages/stores-page.jsx"));
const ImportPage = lazy(() => import("@/pages/import-page.jsx"));
const CorrectionsPage = lazy(() => import("@/pages/corrections-page.jsx"));
const ExportPage = lazy(() => import("@/pages/export-page.jsx"));
const PromotionsPage = lazy(() => import("@/pages/promotions-page.jsx"));
const DataManagementPage = lazy(() => import("@/pages/data-management-page.jsx"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
        handle: { title: "Dashboard Overview" }
      },
      {
        path: "products",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF", "OWNER"]}>
            <ProductsPage />
          </ProtectedRoute>
        ),
        handle: { title: "Master Products Data" }
      },
      {
        path: "stores",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF", "OWNER"]}>
            <StoresPage />
          </ProtectedRoute>
        ),
        handle: { title: "Master Stores Integration" }
      },
      {
        path: "import",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF"]}>
            <ImportPage />
          </ProtectedRoute>
        ),
        handle: { title: "Import Marketplace Data" }
      },
      {
        path: "corrections",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF", "OWNER"]}>
            <CorrectionsPage />
          </ProtectedRoute>
        ),
        handle: { title: "Data Correction Workspace" }
      },
      {
        path: "export",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF", "OWNER"]}>
            <ExportPage />
          </ProtectedRoute>
        ),
        handle: { title: "Export Reports & Settings" }
      },
      {
        path: "promotions",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STAFF", "OWNER"]}>
            <PromotionsPage />
          </ProtectedRoute>
        ),
        handle: { title: "Promotions Analytics" }
      },
      {
        path: "data-management",
        element: (
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <DataManagementPage />
          </ProtectedRoute>
        ),
        handle: { title: "All Data Management" }
      },
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
