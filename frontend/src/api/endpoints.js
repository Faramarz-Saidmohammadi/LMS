export const ENDPOINTS = {
  // auth
  register: "/register",
  login: "/login",
  logout: "/logout",

  sendVerifyCode: "/send-verify-code",
  verifyEmail: "/verify-email",

  acceptInvitation: "/accept-invitation",

  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  // me (IMPORTANT: اینا خارج از /auth هستند)
  meProfile: "/me/profile",
  meChangePassword: "/me/change-password",
};
