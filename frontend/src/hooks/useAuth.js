import { useAuthStore } from "../stores/auth.store";

export default function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuth);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const updateUser = useAuthStore((s) => s.updateUser);

  return { user, isAuth, setAuth, clearAuth, updateUser };
}
