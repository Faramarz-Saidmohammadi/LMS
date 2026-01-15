import { api } from "./axios";

export const meApi = {
  // multipart/form-data
  updateProfile: (formData) =>
    api.patch("/me/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // json
  changePassword: (payload) => api.patch("/me/change-password", payload),
};
