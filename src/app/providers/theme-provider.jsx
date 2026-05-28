import { useEffect } from "react";
import { useLayoutStore } from "@/shared/stores/layout-store.js";

export function ThemeProvider({ children }) {
  const theme = useLayoutStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  return children;
}
