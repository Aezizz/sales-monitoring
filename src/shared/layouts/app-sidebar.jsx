import { ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { appNavigation } from "@/app/navigation.js";
import { Button } from "@/shared/components/ui/button.jsx";
import { cn } from "@/shared/lib/utils.js";
import { useLayoutStore } from "@/shared/stores/layout-store.js";
import { useAuthStore } from "@/shared/stores/authStore.js";

export function AppSidebar() {
  const collapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const mobileOpen = useLayoutStore((state) => state.mobileSidebarOpen);
  const setMobileOpen = useLayoutStore((state) => state.setMobileSidebarOpen);
  const { user } = useAuthStore();

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card/90 shadow-soft backdrop-blur transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent collapsed={collapsed} user={user} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside className="relative z-10 flex h-full w-72 flex-col border-r border-border bg-card shadow-xl">
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              showMobileClose
              user={user}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({ collapsed, onNavigate, showMobileClose = false, user }) {
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const setMobileOpen = useLayoutStore((state) => state.setMobileSidebarOpen);

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <p className="truncate text-sm font-semibold">Commerce Monitor</p>
            <p className="truncate text-xs text-muted-foreground">Sales operations</p>
          </div>
        </div>
        {showMobileClose ? (
          <Button
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        ) : (
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("shrink-0", collapsed && "hidden")}
            onClick={toggleSidebar}
            size="icon"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
            variant="ghost"
          >
            <ChevronLeft />
          </Button>
        )}
      </div>

      {collapsed ? (
        <div className="border-b border-border px-4 py-3">
          <Button
            aria-label="Expand sidebar"
            onClick={toggleSidebar}
            size="icon"
            title="Expand sidebar"
            type="button"
            variant="ghost"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 px-3 py-4">
        {appNavigation
          .filter((item) => !item.allowedRoles || item.allowedRoles.includes(user?.role))
          .map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0",
                  isActive && "bg-accent text-accent-foreground"
                )
              }
              end
              key={item.href}
              onClick={onNavigate}
              title={collapsed ? item.title : undefined}
              to={item.href}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", collapsed && "sr-only")}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div
          className={cn(
            "rounded-md border border-border bg-background px-3 py-2",
            collapsed && "px-2 text-center"
          )}
        >
          <p className="text-xs font-medium text-foreground">v0.1.0</p>
          <p className={cn("mt-1 text-xs text-muted-foreground", collapsed && "sr-only")}>
            Layout phase
          </p>
        </div>
      </div>
    </>
  );
}
