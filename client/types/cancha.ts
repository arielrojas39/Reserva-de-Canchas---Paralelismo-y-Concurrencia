export type FormatoCancha = "futbol5" | "futbol7" | "futbol11";

export type SuperficieCancha = "sintetico" | "cesped" | "parquet";

export interface Cancha {
  id: string;
  nombre: string;
  descripcion: string;
  formato: FormatoCancha;
  superficie: SuperficieCancha;
  direccion: string;
  /** Precio por hora en pesos argentinos. */
  precioPorHora: number;
  iluminacion: boolean;
  activa: boolean;
  imagenUrl?: string;
}
