import { baseUrlApi } from "@/lib/api/config";
import { obtenerToken } from "@/lib/api/token";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validationMessage(detail: unknown): string | null {
  if (!Array.isArray(detail)) return null;
  const messages = detail.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.msg !== "string") return [];
    const location = Array.isArray(entry.loc)
      ? entry.loc.filter(
          (part): part is string | number => typeof part === "string" || typeof part === "number",
        )
      : [];
    const field = location
      .filter((part) => part !== "body" && part !== "query" && part !== "path")
      .join(".");
    return [field ? `${field}: ${entry.msg}` : entry.msg];
  });
  return messages.length ? messages.join("; ") : null;
}

export function parseApiError(status: number, body: unknown): ApiError {
  if (isRecord(body)) {
    const detail = body.detail;
    if (typeof detail === "string" && detail.trim()) return new ApiError(status, detail);
    const validation = validationMessage(detail);
    if (validation) return new ApiError(status, validation);
    if (typeof body.message === "string" && body.message.trim()) {
      return new ApiError(status, body.message);
    }
  }
  return new ApiError(status, `La API respondió con un error HTTP ${status}.`);
}

export interface ApiRequestOptions extends Omit<RequestInit, "signal"> {
  signal?: AbortSignal;
  timeoutMs?: number;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = baseUrlApi();
  if (!baseUrl) throw new ApiError(503, "La API no está configurada.");

  const { timeoutMs = 10_000, signal: externalSignal, authenticated = false, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromCaller();
  else externalSignal?.addEventListener("abort", abortFromCaller, { once: true });

  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated) {
    const token = obtenerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    const raw = await response.text();
    let body: unknown = null;
    if (raw) {
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        body = { detail: raw };
      }
    }
    if (!response.ok) throw parseApiError(response.status, body);
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = controller.signal.aborted
      ? "La solicitud a la API agotó el tiempo de espera o fue cancelada."
      : "No se pudo conectar con el servicio. Verificá la conexión e intentá nuevamente.";
    throw new ApiError(0, message);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}
