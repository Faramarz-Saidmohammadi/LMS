// import axios from "axios";
// import { ENV } from "../config/env";

// export const api = axios.create({
//   baseURL: ENV.API_BASE_URL,
//   withCredentials: ENV.WITH_CREDENTIALS,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export const apiPrivate = axios.create({
//   baseURL: ENV.API_BASE_URL,
//   withCredentials: ENV.WITH_CREDENTIALS,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
import axios from "axios";
import { ENV } from "../config/env";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: ENV.WITH_CREDENTIALS,
  headers: { "Content-Type": "application/json" },
});
