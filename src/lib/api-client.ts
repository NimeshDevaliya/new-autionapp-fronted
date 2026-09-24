import axios, { AxiosError, AxiosRequestConfig } from "axios";
import type { ApiEnvelope, Paginated } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL && typeof window !== "undefined") {
  // fail loudly in development rather than firing requests at the wrong origin
  console.error(
    "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set it."
  );
}

const TOKEN_KEY = "mv_auction_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode) — session lives for this tab only */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * "localhost" in the configured API address means this machine only from the
 * browser's point of view. When the app is opened from another device on the
 * network (http://192.168.x.x:3000), point the API at that same host instead
 * of the device's own localhost. Explicit non-local addresses are left alone.
 */
export function resolveBaseUrl(configured: string): string {
  if (typeof window === "undefined") return configured;
  try {
    const url = new URL(configured);
    const isLocal = (host: string) =>
      host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (isLocal(url.hostname) && !isLocal(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    /* not a parseable URL — use it as written */
  }
  return configured;
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(BASE_URL ?? "http://localhost:3005/api"),
  headers: {
    "Content-Type": "application/json",
    // ngrok's free tier answers browser-looking requests with an HTML
    // interstitial unless this header is present; harmless elsewhere.
    "ngrok-skip-browser-warning": "1",
  },
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalised error surfaced to the UI. */
export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

export function toApiError(
  error: unknown,
  onUnauthorized: () => void = clearToken
): ApiRequestError {
  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;

  if (axiosError.code === "ECONNABORTED") {
    return new ApiRequestError("The request timed out. Please try again.", 408);
  }

  if (!axiosError.response) {
    return new ApiRequestError(
      "Can't reach the server. Check your connection and that the API is running.",
      0
    );
  }

  const { status, data } = axiosError.response;

  // an expired or revoked session should not leave a stale token behind —
  // which token depends on the client (admin panel vs team app)
  if (status === 401 && typeof window !== "undefined") {
    onUnauthorized();
  }

  return new ApiRequestError(
    data?.message ?? defaultMessageFor(status),
    status,
    data?.errors
  );
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return "That request wasn't valid.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "That action conflicts with the current state.";
    case 422:
      return "Please correct the highlighted fields.";
    case 429:
      return "Too many requests. Please wait a moment.";
    default:
      return "Something went wrong on our end.";
  }
}

/** Returns the payload, discarding the envelope. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Returns payload plus pagination metadata for list endpoints. */
export async function requestList<T>(
  config: AxiosRequestConfig
): Promise<Paginated<T>> {
  try {
    const response = await apiClient.request<ApiEnvelope<T[]>>(config);
    return { items: response.data.data, meta: response.data.meta };
  } catch (error) {
    throw toApiError(error);
  }
}
