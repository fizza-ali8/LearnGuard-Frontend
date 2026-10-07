import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

/** Demo mode is the default until a live API URL is set. Set NEXT_PUBLIC_DEMO_MODE to override. */
export function isDemoMode() {
  const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !process.env.NEXT_PUBLIC_API_URL;
}

export function isMockApi() {
  return isDemoMode();
}

export function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
