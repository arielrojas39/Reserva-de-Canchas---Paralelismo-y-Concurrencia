import type { Cancha } from "@/types";

/** Datos de demostración de canchas de fútbol. */
export const canchasMock: Cancha[] = [
  {
    id: "cancha-1",
    nombre: "Fútbol 5 Los Álamos",
    descripcion:
      "Cancha de césped sintético con iluminación, ideal para partidos nocturnos entre amigos.",
    formato: "futbol5",
    superficie: "sintetico",
    direccion: "Av. Santa Fe 3400, Palermo",
    precioPorHora: 18000,
    iluminacion: true,
    activa: true,
    imagenUrl: "/images/cancha-1.svg",
  },
  {
    id: "cancha-2",
    nombre: "Complejo El Potrero",
    descripcion: "Fútbol 7 de césped natural con vestuarios y estacionamiento propio.",
    formato: "futbol7",
    superficie: "cesped",
    direccion: "Av. Rivadavia 7300, Flores",
    precioPorHora: 26000,
    iluminacion: true,
    activa: true,
    imagenUrl: "/images/cancha-2.svg",
  },
  {
    id: "cancha-3",
    nombre: "Fútbol Park Norte",
    descripcion:
      "Cancha de fútbol 11 con medidas oficiales, perfecta para equipos que entrenan en serio.",
    formato: "futbol11",
    superficie: "cesped",
    direccion: "Panamericana km 24.5, San Isidro",
    precioPorHora: 42000,
    iluminacion: false,
    activa: true,
    imagenUrl: "/images/cancha-3.svg",
  },
  {
    id: "cancha-4",
    nombre: "Cancha 5 Caballito",
    descripcion:
      "Cancha de barrio con césped sintético renovado y accesos cómodos desde la avenida.",
    formato: "futbol5",
    superficie: "sintetico",
    direccion: "Av. Directorio 5100, Caballito",
    precioPorHora: 15000,
    iluminacion: false,
    activa: true,
    imagenUrl: "/images/cancha-4.svg",
  },
];
