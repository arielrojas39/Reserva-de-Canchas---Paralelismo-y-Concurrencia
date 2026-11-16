"use client";

import { Search } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { EstadoReserva } from "@/types";
import styles from "./ReservationFilters.module.scss";

export interface FiltrosReservas {
  /** Texto libre (nombre, correo, cancha o ID). */
  busqueda: string;
  /** Clave de fecha (YYYY-MM-DD) o "todas". */
  fecha: string;
  /** ID de cancha o "todas". */
  cancha: string;
  /** Estado de reserva o "todos". */
  estado: EstadoReserva | "todos";
}

export const FILTROS_INICIALES: FiltrosReservas = {
  busqueda: "",
  fecha: "todas",
  cancha: "todas",
  estado: "todos",
};

const ESTADOS: Array<{ valor: EstadoReserva; texto: string }> = [
  { valor: "pendiente", texto: "Pendiente" },
  { valor: "pagando", texto: "Pagando" },
  { valor: "confirmada", texto: "Confirmada" },
  { valor: "cancelada", texto: "Cancelada" },
  { valor: "expirada", texto: "Expirada" },
];

export interface ReservationFiltersProps {
  filtros: FiltrosReservas;
  /** Valores únicos de fecha presentes en los datos (YYYY-MM-DD). */
  fechas: string[];
  /** Valores únicos de cancha presentes en los datos. */
  canchas: Array<{ id: string; nombre: string }>;
  /** Cantidad de reservas que pasan los filtros / total. */
  resultados: { filtradas: number; total: number };
  onCambio: (parcial: Partial<FiltrosReservas>) => void;
  onLimpiar: () => void;
}

/** Barra de filtros y búsqueda sobre los datos mock de reservas. */
export function ReservationFilters({
  filtros,
  fechas,
  canchas,
  resultados,
  onCambio,
  onLimpiar,
}: ReservationFiltersProps) {
  const hayFiltros =
    filtros.busqueda !== "" ||
    filtros.fecha !== "todas" ||
    filtros.cancha !== "todas" ||
    filtros.estado !== "todos";

  return (
    <div className={styles.panel}>
      <div className={styles.buscador}>
        <Input
          label="Buscar"
          type="search"
          placeholder="Nombre, correo, cancha o ID…"
          value={filtros.busqueda}
          onChange={(event) => onCambio({ busqueda: event.target.value })}
        />
        <Search className={styles.iconoBusqueda} size={18} aria-hidden="true" />
      </div>

      <div className={styles.selects}>
        <div className={styles.campo}>
          <label htmlFor="filtro-fecha" className={styles.label}>
            Fecha
          </label>
          <select
            id="filtro-fecha"
            className={styles.select}
            value={filtros.fecha}
            onChange={(event) => onCambio({ fecha: event.target.value })}
          >
            <option value="todas">Todas las fechas</option>
            {fechas.map((fecha) => (
              <option key={fecha} value={fecha}>
                {fecha}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <label htmlFor="filtro-cancha" className={styles.label}>
            Cancha
          </label>
          <select
            id="filtro-cancha"
            className={styles.select}
            value={filtros.cancha}
            onChange={(event) => onCambio({ cancha: event.target.value })}
          >
            <option value="todas">Todas las canchas</option>
            {canchas.map((cancha) => (
              <option key={cancha.id} value={cancha.id}>
                {cancha.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.campo}>
          <label htmlFor="filtro-estado" className={styles.label}>
            Estado
          </label>
          <select
            id="filtro-estado"
            className={styles.select}
            value={filtros.estado}
            onChange={(event) =>
              onCambio({ estado: event.target.value as EstadoReserva | "todos" })
            }
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.pie}>
        <p className={styles.contador} aria-live="polite">
          {hayFiltros
            ? `${resultados.filtradas} de ${resultados.total} reservas`
            : `${resultados.total} reserva${resultados.total === 1 ? "" : "s"}`}
        </p>
        {hayFiltros && (
          <Button variant="outline" size="sm" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
