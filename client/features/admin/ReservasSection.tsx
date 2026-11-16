"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui";
import { AdminReservationsTable } from "@/features/admin/AdminReservationsTable";
import {
  FILTROS_INICIALES,
  ReservationFilters,
  type FiltrosReservas,
} from "@/features/admin/ReservationFilters";
import { obtenerReservasParaAdmin } from "@/lib/services/reservas.service";
import type { ReservaAdmin } from "@/lib/services/reservas.service";
import styles from "./ReservasSection.module.scss";

/** Sección administrativa de reservas conectada a la API. */
export function ReservasSection() {
  const [reservas, setReservas] = useState<ReservaAdmin[] | null>(null);
  const [error, setError] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosReservas>(FILTROS_INICIALES);

  useEffect(() => {
    let cancelado = false;

    obtenerReservasParaAdmin()
      .then((todas) => {
        if (cancelado) return;
        setError(false);
        setReservas(todas);
      })
      .catch(() => {
        if (cancelado) return;
        setError(true);
        setReservas([]);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const fechas = useMemo(
    () => [...new Set((reservas ?? []).map(({ reserva }) => reserva.fecha))].sort().reverse(),
    [reservas],
  );

  const canchas = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const { reserva, cancha } of reservas ?? []) {
      if (!mapa.has(reserva.canchaId)) {
        mapa.set(reserva.canchaId, cancha?.nombre ?? `Cancha #${reserva.canchaId}`);
      }
    }
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [reservas]);

  const filtradas = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    const texto = normalizar(filtros.busqueda);
    return (reservas ?? []).filter(({ reserva, cancha, usuario }) => {
      if (filtros.fecha !== "todas" && reserva.fecha !== filtros.fecha) return false;
      if (filtros.cancha !== "todas" && reserva.canchaId !== filtros.cancha) return false;
      if (filtros.estado !== "todos" && reserva.estado !== filtros.estado) return false;
      if (texto) {
        const objetivo = normalizar(
          [reserva.id, usuario?.nombre ?? "", usuario?.email ?? "", cancha?.nombre ?? ""].join(" "),
        );
        if (!objetivo.includes(texto)) return false;
      }
      return true;
    });
  }, [reservas, filtros]);

  const hayFiltros =
    filtros.busqueda !== "" ||
    filtros.fecha !== "todas" ||
    filtros.cancha !== "todas" ||
    filtros.estado !== "todos";

  const handleCambio = (parcial: Partial<FiltrosReservas>) => {
    setFiltros((actual) => ({ ...actual, ...parcial }));
  };

  if (!reservas) {
    return (
      <div className={styles.cargando} aria-busy="true">
        <Skeleton height="120px" radius="14px" />
        <Skeleton height="48px" radius="10px" />
        <Skeleton height="48px" radius="10px" />
      </div>
    );
  }

  return (
    <>
      <ReservationFilters
        filtros={filtros}
        fechas={fechas}
        canchas={canchas}
        resultados={{ filtradas: filtradas.length, total: reservas.length }}
        onCambio={handleCambio}
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
      />
      <AdminReservationsTable
        reservas={filtradas}
        error={error}
        vacioPorFiltros={hayFiltros && filtradas.length === 0}
      />
    </>
  );
}
