import { Suspense } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { AppSidebar } from "@/shared/layouts/app-sidebar.jsx";
import { LayoutContainer } from "@/shared/layouts/layout-container.jsx";
import { LayoutLoading } from "@/shared/layouts/layout-loading.jsx";
import { TopNavigation } from "@/shared/layouts/top-navigation.jsx";

export function DashboardLayout() {
  const matches = useMatches();
  const title =
    [...matches].reverse().find((match) => match.handle?.title)?.handle.title ??
    "Workspace";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation title={title} />
        <LayoutContainer>
          <Suspense fallback={<LayoutLoading />}>
            <Outlet />
          </Suspense>
        </LayoutContainer>
      </div>
    </div>
  );
}
