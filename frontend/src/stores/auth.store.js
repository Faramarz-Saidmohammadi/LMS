import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuth: false,

      setAuth: (user) => set({ user, isAuth: true }),
      clearAuth: () => set({ user: null, isAuth: false }),

      // ✅ برای آپدیت پروفایل
      updateUser: (patch) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...patch } : s.user,
        })),
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user, isAuth: s.isAuth }),
    }
  )
);
