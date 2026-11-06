import type { Usuario } from "@/types";

/** Usuarios de demostración. */
export const usuariosMock: Usuario[] = [
  {
    id: "usuario-1",
    nombre: "Martín Gómez",
    email: "martin.gomez@example.com",
    telefono: "+54 9 11 5555-0101",
    rol: "cliente",
    creadoEn: "2026-09-02T12:00:00.000Z",
  },
  {
    id: "usuario-2",
    nombre: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    rol: "cliente",
    creadoEn: "2026-09-15T12:00:00.000Z",
  },
  {
    id: "usuario-3",
    nombre: "Ana Admin",
    email: "ana.admin@example.com",
    rol: "admin",
    creadoEn: "2026-09-20T12:00:00.000Z",
  },
];
