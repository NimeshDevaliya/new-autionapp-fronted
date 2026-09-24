import axios, { type AxiosRequestConfig } from "axios";
import { resolveBaseUrl, toApiError } from "./api-client";
import type { ApiEnvelope } from "@/types";

/** Separate from the admin token so one device can hold both sessions. */
const TEAM_TOKEN_KEY = "mv_team_token";

export function getTeamToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TEAM_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTeamToken(token: string): void {
  try {
    window.localStorage.setItem(TEAM_TOKEN_KEY, token);
  } catch {
    /* storage unavailable — session lives for this tab only */
  }
}

export function clearTeamToken(): void {
  try {
    window.localStorage.removeItem(TEAM_TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

const teamApiClient = axios.create({
  baseURL: resolveBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005/api"),
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  },
  timeout: 20_000,
});

teamApiClient.interceptors.request.use((config) => {
  const token = getTeamToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Same envelope handling as `request`, but with the owner's token. */
export async function teamRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await teamApiClient.request<ApiEnvelope<T>>(config);
    return response.data.data;
  } catch (error) {
    throw toApiError(error, clearTeamToken);
  }
}
