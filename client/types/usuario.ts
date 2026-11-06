export type UserRole = "cliente" | "admin";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  /** Fecha de creación en formato ISO 8601. */
  creadoEn: string;
}
