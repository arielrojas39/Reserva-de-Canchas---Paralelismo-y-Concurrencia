"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { apiHabilitada } from "@/lib/api/config";
import { ApiError } from "@/lib/api/http";
import { meApi } from "@/lib/api/auth";
import { limpiarToken, obtenerToken } from "@/lib/api/token";
import { mapUserResponse } from "@/lib/api/mappers";
import { iniciarSesion as iniciarSesionService } from "@/lib/services/auth.service";
import type { Usuario } from "@/types";

const STORAGE_KEY = "canchasplay:sesion-demo";
const SESSION_EVENT = "canchasplay:sesion-change";

export type EstadoSesion = "visitante" | "usuario" | "admin";

export interface SesionContextValue {
  usuario: Usuario | null;
  estado: EstadoSesion;
  isRestoring: boolean;
  iniciarSesion: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  cerrarSesion: () => void;
}

interface SessionSnapshot {
  usuario: Usuario | null;
  isRestoring: boolean;
}

const SesionContext = createContext<SesionContextValue | null>(null);
// API sessions live in browser storage: render a neutral restoration state on SSR
// so protected routes/header do not briefly claim the visitor is signed out.
const SNAPSHOT_SERVIDOR: SessionSnapshot = { usuario: null, isRestoring: apiHabilitada() };
let apiUsuario: Usuario | null = null;
let apiRestoreComplete = false;
let observedToken: string | null = null;

function estadoDe(usuario: Usuario | null): EstadoSesion {
  if (!usuario) return "visitante";
  return usuario.rol === "admin" ? "admin" : "usuario";
}

function parseUsuario(raw: string | null): Usuario | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "string" &&
      "nombre" in value &&
      typeof value.nombre === "string" &&
      "email" in value &&
      typeof value.email === "string" &&
      "rol" in value &&
      (value.rol === "cliente" || value.rol === "admin") &&
      "creadoEn" in value &&
      typeof value.creadoEn === "string"
    ) {
      return value as Usuario;
    }
  } catch {
    return null;
  }
  return null;
}

let cacheKey = "";
let cacheSnapshot: SessionSnapshot = SNAPSHOT_SERVIDOR;

function leerSnapshot(): SessionSnapshot {
  if (typeof window === "undefined") return SNAPSHOT_SERVIDOR;
  if (apiHabilitada()) {
    const token = obtenerToken();
    if (token !== observedToken) {
      observedToken = token;
      apiUsuario = null;
      apiRestoreComplete = false;
    }
    const key = `api:${token ?? ""}:${apiUsuario?.id ?? ""}:${apiRestoreComplete}`;
    if (key !== cacheKey) {
      cacheKey = key;
      cacheSnapshot = {
        usuario: token ? apiUsuario : null,
        isRestoring: Boolean(token) && !apiRestoreComplete,
      };
    }
    return cacheSnapshot;
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  const key = `demo:${raw ?? ""}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cacheSnapshot = { usuario: parseUsuario(raw), isRestoring: false };
  }
  return cacheSnapshot;
}

function suscribirCambio(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY || event.key === "canchasplay:token")
      callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

function emitirCambio(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EVENT));
}

function persistirUsuario(usuario: Usuario | null): void {
  try {
    if (usuario) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // La persistencia de la UI no debe impedir el cambio de sesión.
  }
  if (apiHabilitada()) {
    apiUsuario = usuario;
    observedToken = obtenerToken();
    apiRestoreComplete = true;
  }
  emitirCambio();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(suscribirCambio, leerSnapshot, () => SNAPSHOT_SERVIDOR);

  useEffect(() => {
    if (!apiHabilitada() || !obtenerToken()) return;
    let cancelado = false;
    meApi()
      .then((response) => {
        if (cancelado) return;
        apiUsuario = mapUserResponse(response);
        apiRestoreComplete = true;
        persistirUsuario(apiUsuario);
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        apiUsuario = null;
        apiRestoreComplete = true;
        if (error instanceof ApiError && error.status === 401) limpiarToken();
        emitirCambio();
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const resultado = await iniciarSesionService(email, password);
    if (resultado.ok && resultado.usuario) persistirUsuario(resultado.usuario);
    return { ok: resultado.ok, error: resultado.error };
  }, []);

  const cerrarSesion = useCallback(() => {
    if (apiHabilitada()) {
      limpiarToken();
      apiUsuario = null;
      apiRestoreComplete = true;
    }
    persistirUsuario(null);
  }, []);

  return (
    <SesionContext.Provider
      value={{
        usuario: snapshot.usuario,
        estado: estadoDe(snapshot.usuario),
        isRestoring: snapshot.isRestoring,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSession(): SesionContextValue {
  const context = useContext(SesionContext);
  if (!context) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return context;
}
