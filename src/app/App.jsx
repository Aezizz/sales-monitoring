import { useEffect } from "react"; // <-- TAMBAHKAN INI
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/theme-provider.jsx";
import { router } from "@/app/router.jsx";
import { useAuthStore } from "@/shared/stores/authStore"; // <-- TAMBAHKAN INI

export function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    console.log("🚀 App mounted, calling initialize...");
    initialize();
  }, [initialize]); // <-- PANGGIL INITIALIZE SAAT APP PERTAMA KALI RENDER

  // Tampilkan loading screen sambil initialize
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat sesi...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
