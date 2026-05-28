import { create } from "zustand";
import { apiRequest } from "@/shared/api/http"; // <-- IMPORT INI

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    console.log("🔍 Initialize: membaca token dari localStorage");
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("❌ Token tidak ditemukan di localStorage");
      set({ token: null, isAuthenticated: false, user: null });
      return;
    }

    console.log("✅ Token ditemukan, validasi ke backend...");
    set({ isLoading: true, error: null, token });

    try {
      // PAKAI apiRequest, BUKAN fetch langsung
      const data = await apiRequest("/auth/me");

      set({
        user: data.user,
        isAuthenticated: true,
        token: token,
        isLoading: false,
      });
      console.log("✅ Session restored! User:", data.user?.email);
    } catch (err) {
      console.error("❌ Session restoration failed:", err.message);
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      console.log("🔐 Mencoba login...");

      // PAKAI apiRequest, BUKAN fetch langsung
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!data.token || !data.user) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", data.token);
      console.log("✅ Login berhasil, token tersimpan");

      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        error: null,
        isLoading: false,
      });

      return data.user;
    } catch (err) {
      console.error("❌ Login error:", err.message);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    console.log("✅ Logout, token dihapus");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });
  },

  clearError: () => set({ error: null }),
}));
