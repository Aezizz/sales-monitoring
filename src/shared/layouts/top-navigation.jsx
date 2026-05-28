import { Menu, Moon, Sun, User, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/shared/components/ui/dropdown-menu.jsx";
import { useHealthCheck } from "@/shared/api/health.js";
import { useLayoutStore } from "@/shared/stores/layout-store.js";
import { useAuthStore } from "@/shared/stores/authStore.js";

export function TopNavigation({ title }) {
  const health = useHealthCheck();
  const theme = useLayoutStore((state) => state.theme);
  const setTheme = useLayoutStore((state) => state.setTheme);
  const toggleMobileSidebar = useLayoutStore((state) => state.toggleMobileSidebar);
  
  const { user, logout } = useAuthStore();

  const statusLabel = health.isLoading
    ? "Checking"
    : health.isError
      ? "Offline"
      : "Online";

  // Formatter for role tag color
  const getRoleColor = (role) => {
    if (role === "SUPER_ADMIN") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-900/50";
    if (role === "STAFF") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/50";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          aria-label="Toggle sidebar"
          className="lg:hidden"
          onClick={toggleMobileSidebar}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu />
        </Button>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Commerce Insight Hub
          </p>
          <h1 className="truncate text-lg font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* API connection indicator */}
        <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm sm:flex">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-40 ${health.isError ? "bg-red-500" : "bg-green-500"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${health.isError ? "bg-red-500" : "bg-green-500"}`} />
          </span>
          <span>{statusLabel}</span>
        </div>

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Change theme"
              size="icon"
              title="Change theme"
              type="button"
              variant="outline"
            >
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile details */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-3 py-1.5 h-10 select-none"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium sm:block max-w-[120px] truncate">
                  {user.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <div className="pt-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
