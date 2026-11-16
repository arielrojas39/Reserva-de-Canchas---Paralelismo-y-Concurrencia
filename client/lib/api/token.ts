export const TOKEN_STORAGE_KEY = "canchasplay:token";

export function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function guardarToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // El login no debe exponer el token ni fallar con storage deshabilitado.
  }
}

export function limpiarToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // La limpieza es best-effort si el navegador bloquea localStorage.
  }
}
