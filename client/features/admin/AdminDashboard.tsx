"use client";

import { useEffect, useState } from "react";
import { CircleCheck, ClipboardList, Goal, Hourglass } from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { QuickActions } from "@/features/admin/QuickActions";
import { RecentReservations } from "@/features/admin/RecentReservations";
import { StatCard, type StatCardTon } from "@/features/admin/StatCard";
import { claveFecha } from "@/features/canchas/DateSelector";
import { useFechaActual } from "@/hooks/useFechaActual";
import { obtenerCanchas } from "@/lib/services/canchas.service";
import { obtenerReservasParaAdmin, type ReservaAdmin } from "@/lib/services/reservas.service";
import type { EstadoReserva } from "@/types";
import styles from "./AdminDashboard.module.scss";

interface DatosDashboard {
  totalCanchas: number;
  reservas: ReservaAdmin[];
}

const ESTADOS_ACTIVIDAD: Array<{
  estado: EstadoReserva;
  etiqueta: string;
  tono: string;
}> = [
  { estado: "pendiente", etiqueta: "Pendientes", tono: styles.puntoAmbar },
  { estado: "confirmada", etiqueta: "Confirmadas", tono: styles.puntoVerde },
  { estado: "cancelada", etiqueta: "Canceladas", tono: styles.puntoRojo },
  { estado: "expirada", etiqueta: "Expiradas", tono: styles.puntoGris },
];

/**
 * Dashboard administrativo con métricas reales de la API.
 */
export function AdminDashboard() {
  const hoy = useFechaActual();
  const [datos, setDatos] = useState<DatosDashboard | null>(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([obtenerCanchas(), obtenerReservasParaAdmin()]).then(([canchas, reservas]) => {
      if (cancelado) return;
      setDatos({ totalCanchas: canchas.length, reservas });
    });

    return () => {
      cancelado = true;
    };
  }, []);

  const claveHoy = hoy ? claveFecha(hoy) : null;

  const total = datos?.reservas.length ?? 0;
  const pendientes = datos?.reservas.filter((r) => r.reserva.estado === "pendiente").length ?? 0;
  const confirmadas = datos?.reservas.filter((r) => r.reserva.estado === "confirmada").length ?? 0;
  const delDia =
    datos && claveHoy ? datos.reservas.filter((r) => r.reserva.fecha === claveHoy).length : null;

  const statCards: Array<{
    icono: typeof Goal;
    etiqueta: string;
    valor: string;
    descripcion: string;
    tono: StatCardTon;
  }> = [
    {
      icono: Goal,
      etiqueta: "Total de canchas",
      valor: datos ? String(datos.totalCanchas) : "…",
      descripcion: "Canchas activas en la plataforma",
      tono: "verde",
    },
    {
      icono: ClipboardList,
      etiqueta: "Reservas del día",
      valor: delDia != null ? String(delDia) : "…",
      descripcion: claveHoy ? `Turnos con fecha ${claveHoy}` : "Calculando…",
      tono: "azul",
    },
    {
      icono: Hourglass,
      etiqueta: "Pendientes de pago",
      valor: datos ? String(pendientes) : "…",
      descripcion: "Con plazo de pago en curso",
      tono: "ambar",
    },
    {
      icono: CircleCheck,
      etiqueta: "Confirmadas",
      valor: datos ? String(confirmadas) : "…",
      descripcion: "Reservas con pago aprobado",
      tono: "verde",
    },
  ];

  return (
    <>
      <section aria-labelledby="stats-title" className={styles.seccion}>
        <h2 id="stats-title" className={styles.seccionTitle}>
          Resumen del día
        </h2>
        {datos ? (
          <div className={styles.stats}>
            {statCards.map((stat) => (
              <StatCard
                key={stat.etiqueta}
                icono={stat.icono}
                etiqueta={stat.etiqueta}
                valor={stat.valor}
                descripcion={stat.descripcion}
                tono={stat.tono}
              />
            ))}
          </div>
        ) : (
          <div className={styles.stats}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height="150px" radius="14px" />
            ))}
          </div>
        )}
      </section>

      <div className={styles.columnas}>
        <section aria-labelledby="recientes-title" className={styles.seccion}>
          <h2 id="recientes-title" className={styles.seccionTitle}>
            Últimas reservas
          </h2>
          <RecentReservations limite={5} />
        </section>

        <div className={styles.lateral}>
          <section aria-labelledby="acciones-title" className={styles.seccion}>
            <h2 id="acciones-title" className={styles.seccionTitle}>
              Accesos rápidos
            </h2>
            <Card className={styles.card}>
              <QuickActions />
            </Card>
          </section>

          <section aria-labelledby="actividad-title" className={styles.seccion}>
            <h2 id="actividad-title" className={styles.seccionTitle}>
              Resumen de actividad
            </h2>
            <Card className={styles.card}>
              <ul className={styles.actividad}>
                {ESTADOS_ACTIVIDAD.map((item) => {
                  const cantidad =
                    datos?.reservas.filter((r) => r.reserva.estado === item.estado).length ?? null;
                  return (
                    <li key={item.estado} className={styles.actividadFila}>
                      <span className={`${styles.punto} ${item.tono}`} aria-hidden="true" />
                      <span className={styles.actividadEtiqueta}>{item.etiqueta}</span>
                      <span className={styles.actividadValor}>{cantidad ?? "…"}</span>
                    </li>
                  );
                })}
              </ul>
              <p className={styles.actividadTotal}>
                {total} reserva{total === 1 ? "" : "s"} en total
              </p>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
