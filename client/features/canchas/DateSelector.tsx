"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useFechaActual } from "@/hooks/useFechaActual";
import { cn } from "@/lib/utils/cn";
import styles from "./DateSelector.module.scss";

/** Cantidad de días posteriores habilitados (hoy incluido). */
const DIAS_HABILES = 31;

export interface OpcionFecha {
  clave: string;
  titulo: string;
  diaSemana: string;
  dia: string;
  mes: string;
  esHoy: boolean;
}

export function claveFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

const formatoTitulo = new Intl.DateTimeFormat("es-AR", { weekday: "long" });
const formatoDia = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
const formatoMes = new Intl.DateTimeFormat("es-AR", { month: "short" });

function construirOpciones(hoy: Date): OpcionFecha[] {
  return Array.from({ length: DIAS_HABILES }, (_, indice) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + indice);
    return {
      clave: claveFecha(fecha),
      titulo: indice === 0 ? "Hoy" : formatoTitulo.format(fecha),
      diaSemana: formatoDia.format(fecha).replace(".", ""),
      dia: String(fecha.getDate()),
      mes: formatoMes.format(fecha).replace(".", ""),
      esHoy: indice === 0,
    };
  });
}

export interface DateSelectorProps {
  /** Clave YYYY-MM-DD seleccionada (null antes de la hidratación). */
  seleccionada: string | null;
  onSelect: (clave: string) => void;
}

/**
 * Selector de fecha: desde hoy hasta 30 días posteriores.
 * No genera fechas anteriores (la grilla arranca en el día actual).
 */
export function DateSelector({ seleccionada, onSelect }: DateSelectorProps) {
  const hoy = useFechaActual();
  const opciones = useMemo(() => (hoy ? construirOpciones(hoy) : null), [hoy]);

  if (!opciones) {
    return (
      <div className={styles.block}>
        <p className={styles.label}>Elegí una fecha</p>
        <div className={styles.strip} aria-busy="true" aria-label="Cargando fechas">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} width="64px" height="76px" radius="14px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.block}>
      <p className={styles.label} id="fecha-label">
        Elegí una fecha <span className={styles.rango}>(hasta 30 días)</span>
      </p>
      <div className={styles.strip} role="group" aria-labelledby="fecha-label">
        {opciones.map((opcion) => {
          const activa = opcion.clave === seleccionada;
          return (
            <button
              key={opcion.clave}
              type="button"
              aria-pressed={activa}
              aria-label={`${opcion.titulo} ${opcion.dia} de ${opcion.mes}`}
              className={cn(styles.dia, activa && styles.diaActivo)}
              onClick={() => onSelect(opcion.clave)}
            >
              <span className={styles.diaTitulo}>
                <CalendarDays
                  size={12}
                  aria-hidden="true"
                  className={cn(styles.diaIcono, !opcion.esHoy && styles.diaIconoOculto)}
                />
                {opcion.esHoy ? "Hoy" : opcion.diaSemana}
              </span>
              <span className={styles.diaNumero}>{opcion.dia}</span>
              <span className={styles.diaMes}>{opcion.mes}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
