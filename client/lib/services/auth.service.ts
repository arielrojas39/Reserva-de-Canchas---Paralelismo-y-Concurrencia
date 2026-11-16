import { PASSWORD_DEMO, RETARDO_SIMULADO_MS } from "@/lib/mocks/auth.mock";
import { usuariosMock } from "@/lib/mocks/usuarios.mock";
import { esperarSimulado } from "@/lib/services/demo.config";
import { apiHabilitada } from "@/lib/api/config";
import { loginApi, meApi, registerApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { mapUserResponse } from "@/lib/api/mappers";
import { limpiarToken, guardarToken } from "@/lib/api/token";
import type { Usuario } from "@/types";

/**
 * Servicio simulado de autenticación — SOLO DEMOSTRACIÓN.
 *
 * No valida contraseñas reales ni genera sesiones seguras: compara el
 * email contra los usuarios ficticios de los mocks. La protección real
 * llegará con la integración de un proveedor de autenticación.
 */

export interface ResultadoSesion {
  ok: boolean;
  usuario?: Usuario;
  error?: string;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

function mensajeApi(error: unknown, accion: "login" | "registro"): string {
  if (!(error instanceof ApiError)) return "No se pudo completar la solicitud. Intentá nuevamente.";
  if (error.status === 401) return "El correo o la contraseña no son correctos.";
  if (error.status === 403) return "Tu cuenta no tiene permiso para realizar esta acción.";
  if (error.status === 409 && accion === "registro")
    return "Ese correo ya está registrado. Probá con otro.";
  if (error.status === 422)
    return "Los datos ingresados no son válidos. Revisá el correo y la contraseña.";
  if (error.status === 0 || error.status >= 500) {
    return "El servicio no está disponible. Intentá nuevamente en unos minutos.";
  }
  return error.message;
}

/** Inicio de sesión real cuando NEXT_PUBLIC_API_URL está configurada; conserva la demo en otro caso. */
export async function iniciarSesion(email: string, password: string): Promise<ResultadoSesion> {
  if (!apiHabilitada()) return iniciarSesionDemo(email, password);
  try {
    const tokenResponse = await loginApi(email.trim(), password);
    guardarToken(tokenResponse.access_token);
    const userResponse = await meApi();
    return { ok: true, usuario: mapUserResponse(userResponse) };
  } catch (error) {
    limpiarToken();
    return { ok: false, error: mensajeApi(error, "login") };
  }
}

/** Registro real; la respuesta de FastAPI no inicia sesión automáticamente. */
export async function registrarse(datos: DatosRegistro): Promise<ResultadoSesion> {
  if (!apiHabilitada()) return registrarseDemo(datos);
  try {
    const user = await registerApi({
      name: datos.nombre.trim(),
      email: datos.email.trim(),
      password: datos.password,
    });
    return { ok: true, usuario: mapUserResponse(user) };
  } catch (error) {
    return { ok: false, error: mensajeApi(error, "registro") };
  }
}

export async function iniciarSesionDemo(email: string, password: string): Promise<ResultadoSesion> {
  await esperarSimulado(RETARDO_SIMULADO_MS);

  const usuario = usuariosMock.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!usuario || password !== PASSWORD_DEMO) {
    return {
      ok: false,
      error: "Credenciales demo incorrectas. Usá una de las cuentas de prueba que aparecen abajo.",
    };
  }

  return { ok: true, usuario };
}

/**
 * Simula un registro: no persiste la cuenta. El alta real llegará con la
 * autenticación definitiva.
 */
export async function registrarseDemo(datos: DatosRegistro): Promise<ResultadoSesion> {
  await esperarSimulado(RETARDO_SIMULADO_MS);

  const duplicado = usuariosMock.some(
    (u) => u.email.toLowerCase() === datos.email.trim().toLowerCase(),
  );

  if (duplicado) {
    return {
      ok: false,
      error: "Ese correo ya está registrado en la demo. Probá con otro.",
    };
  }

  return { ok: true };
}
