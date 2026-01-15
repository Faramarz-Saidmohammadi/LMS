import { api } from "./axios";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),

  sendVerifyCode: (payload) => api.post("/auth/send-verify-code", payload),
  verifyEmail: (payload) => api.post("/auth/verify-email", payload),

  acceptInvitation: (payload) => api.post("/auth/accept-invitation", payload),

  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
};
