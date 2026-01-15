import { useEffect } from "react";
import { apiPrivate, api } from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { useAuthStore } from "../stores/auth.store";

export default function useAxiosPrivate() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const reqIntercept = apiPrivate.interceptors.request.use(
      (config) => {
        // اگر بک‌اندت با Cookie کار می‌کند، همین withCredentials کافی است.
        // اگر توکن را در Header می‌فرستی، اینجا می‌تونی اضافه کنی.
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resIntercept = apiPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;

        // اگر 401 شد و قبلاً retry نشده بود
        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // تلاش برای refresh
            await api.post(ENDPOINTS.auth.refresh);

            // دوباره همان درخواست
            return apiPrivate(originalRequest);
          } catch (refreshErr) {
            clearAuth();
            return Promise.reject(refreshErr);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      apiPrivate.interceptors.request.eject(reqIntercept);
      apiPrivate.interceptors.response.eject(resIntercept);
    };
  }, [setUser, clearAuth]);

  return apiPrivate;
}
