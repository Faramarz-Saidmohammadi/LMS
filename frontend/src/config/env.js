export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
  WITH_CREDENTIALS: String(import.meta.env.VITE_WITH_CREDENTIALS || "true") === "true",
};
