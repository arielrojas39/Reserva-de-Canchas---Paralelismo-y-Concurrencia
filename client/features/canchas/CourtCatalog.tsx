"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Alert, Button, EmptyState } from "@/components/ui";
import { AvailabilityGrid } from "@/features/canchas/AvailabilityGrid";
import { CourtFilters } from "@/features/canchas/CourtFilters";
import { CourtList } from "@/features/canchas/CourtList";
import { DateSelector, claveFecha } from "@/features/canchas/DateSelector";
import { estadoUiDe } from "@/features/canchas/canchas.types";
import { ReservationModal } from "@/features/reservas/ReservationModal";
import { ReservationSummary } from "@/features/reservas/ReservationSummary";
import { useFechaActual } from "@/hooks/useFechaActual";
import { useSession } from "@/contexts/SessionContext";
import { obtenerCanchas } from "@/lib/services/canchas.service";
import { contarDisponibles, obtenerHorarios } from "@/lib/services/horarios.service";
import type { CodigoRespuesta, DatosReservaDemo } from "@/lib/services/reservas.service";
import { formatFechaLarga } from "@/lib/utils/fecha";
import { apiHabilitada } from "@/lib/api/config";
import type { Cancha, Horario } from "@/types";
import styles from "./CourtCatalog.module.scss";

export interface CourtCatalogProps {
  canchas: Cancha[];
}

interface ResultadoHorarios {
  clave: string;
  horarios: Horario[];
}

/**
 * Orquestador del catálogo: canchas (server props, refrescadas desde
 * la API o el store de demo al montar), filtros, fecha, horarios y
 * flujo de reserva según el modo configurado. El estado de carga se DERIVA de si el resultado
 * coincide con la clave activa, sin setState síncronos dentro de
 * efectos.
 */
export function CourtCatalog({ canchas: canchasIniciales }: CourtCatalogProps) {
  const hoy = useFechaActual();
  const hoyClave = hoy ? claveFecha(hoy) : null;
  const { usuario } = useSession();

  const [canchas, setCanchas] = useState<Cancha[]>(canchasIniciales);
  const [canchaId, setCanchaId] = useState(canchasIniciales[0]?.id ?? "");
  const [fechaManual, setFechaManual] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoHorarios | null>(null);
  const [revision, setRevision] = useState(0);
  const [seleccionado, setSeleccionado] = useState<Horario | null>(null);
  const [avisoSesion, setAvisoSesion] = useState(false);
  const [modalDatos, setModalDatos] = useState<DatosReservaDemo | null>(null);
  const [contadores, setContadores] = useState<
    Record<string, { total: number; libres: number } | undefined>
  >({});
  const [errorCanchas, setErrorCanchas] = useState<string | null>(null);
  const [errorHorarios, setErrorHorarios] = useState<{ clave: string; mensaje: string } | null>(
    null,
  );

  // Refresco desde el store de demo (canchas creadas en el panel admin).
  useEffect(() => {
    let cancelado = false;

    obtenerCanchas()
      .then((lista) => {
        if (cancelado) return;
        setErrorCanchas(null);
        setCanchas(lista);
        setCanchaId((actual) =>
          lista.some((cancha) => cancha.id === actual) ? actual : (lista[0]?.id ?? ""),
        );
      })
      .catch(() => {
        if (cancelado) return;
        setCanchas([]);
        setErrorCanchas(
          "No se pudo conectar con el servicio de canchas. Intentá recargar la página.",
        );
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Fecha activa: la elegida por el usuario o, inicialmente, hoy.
  const fecha = fechaManual ?? hoyClave;
  const claveConsulta = fecha ? `${canchaId}:${fecha}` : null;
  const horarios = resultado && resultado.clave === claveConsulta ? resultado.horarios : null;
  const cargando = Boolean(claveConsulta) && horarios === null;

  const canchaActual = canchas.find((c) => c.id === canchaId);

  // Consulta de horarios (solo setState en el callback: permitido).
  // `revision` permite refrescar tras un 201/409.
  useEffect(() => {
    if (!canchaId || !fecha) return;
    const clave = `${canchaId}:${fecha}`;
    let cancelado = false;

    obtenerHorarios(canchaId, fecha)
      .then((horariosObtenidos) => {
        if (cancelado) return;
        setErrorHorarios(null);
        setResultado({ clave, horarios: horariosObtenidos });
        setSeleccionado(null);
      })
      .catch(() => {
        if (cancelado) return;
        setErrorHorarios({
          clave,
          mensaje: "No se pudo consultar la disponibilidad. Intentá nuevamente.",
        });
        setResultado({ clave, horarios: [] });
        setSeleccionado(null);
      });

    return () => {
      cancelado = true;
    };
  }, [canchaId, fecha, revision]);

  // Estado de disponibilidad de cada card (para hoy).
  useEffect(() => {
    if (!hoyClave) return;
    let cancelado = false;

    Promise.all(
      canchas.map(
        async (cancha) => [cancha.id, await contarDisponibles(cancha.id, hoyClave)] as const,
      ),
    )
      .then((pares) => {
        if (cancelado) return;
        setContadores(Object.fromEntries(pares));
      })
      .catch(() => {
        if (cancelado) return;
        setContadores(
          Object.fromEntries(canchas.map((cancha) => [cancha.id, { total: 0, libres: 0 }])),
        );
      });

    return () => {
      cancelado = true;
    };
  }, [canchas, hoyClave, revision]);

  const estados = useMemo(() => {
    const resultadoEstados: Record<string, ReturnType<typeof estadoUiDe>> = {};
    for (const cancha of canchas) {
      resultadoEstados[cancha.id] = estadoUiDe(contadores[cancha.id]);
    }
    return resultadoEstados;
  }, [canchas, contadores]);

  const handleSeleccionar = (horario: Horario) => {
    setSeleccionado(horario);
    setAvisoSesion(false);
  };

  const handleReservar = () => {
    if (!usuario || !canchaActual || !seleccionado || !fecha) {
      // Sin sesión: se muestra el mensaje para iniciar sesión.
      setAvisoSesion(true);
      return;
    }

    setModalDatos({
      canchaId: canchaActual.id,
      canchaNombre: canchaActual.nombre,
      horarioId: seleccionado.id,
      fecha,
      inicio: seleccionado.inicio,
      fin: seleccionado.fin,
      montoTotal: canchaActual.precioPorHora,
      usuarioId: usuario.id,
    });
  };

  const handleResultadoReserva = (codigo: CodigoRespuesta) => {
    // 201 (quedó ocupado) y 409 (conflicto): refrescan la disponibilidad.
    if (codigo === 201 || codigo === 409) {
      setSeleccionado(null);
      setRevision((valor) => valor + 1);
    }
  };

  if (errorCanchas) {
    return (
      <Alert variant="error" title="No se pudieron cargar las canchas">
        {errorCanchas}
      </Alert>
    );
  }

  if (canchas.length === 0) {
    return (
      <EmptyState
        title="No hay canchas disponibles"
        description="Cuando haya canchas cargadas en la plataforma, van a aparecer acá."
      />
    );
  }

  return (
    <div className={styles.catalog}>
      <CourtList
        canchas={canchas}
        estados={estados}
        seleccionadaId={canchaId}
        onSelect={setCanchaId}
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarCard}>
          <CourtFilters canchas={canchas} seleccionadaId={canchaId} onSelect={setCanchaId} />
        </div>
        <div className={styles.toolbarCard}>
          <DateSelector seleccionada={fecha} onSelect={setFechaManual} />
        </div>
      </div>

      <section id="horarios" className={styles.seccion} aria-labelledby="horarios-title">
        <div className={styles.seccionHeader}>
          <div>
            <h2 id="horarios-title" className={styles.seccionTitle}>
              Horarios de {canchaActual?.nombre ?? "…"}
            </h2>
            <p className={styles.seccionFecha}>
              <CalendarDays size={16} aria-hidden="true" />
              {fecha ? formatFechaLarga(fecha) : "Elegí una fecha"}
            </p>
          </div>
        </div>

        {!apiHabilitada() && (
          <div className={styles.demoNote}>
            <Alert variant="info" title="Consulta de demostración">
              Cada cancha tiene su grilla de horarios configurable desde el panel de administración
              (por defecto, de <strong>18:00 a 22:00</strong>). La ocupación por fecha es ficticia:
              siempre es posible encontrar días con y sin disponibilidad para probar los estados.
            </Alert>
          </div>
        )}
        {errorHorarios?.clave === claveConsulta && (
          <Alert variant="error" title="No se pudo consultar disponibilidad">
            {errorHorarios.mensaje}
          </Alert>
        )}

        <AvailabilityGrid
          cargando={cargando}
          horarios={horarios}
          fecha={fecha}
          canchaNombre={canchaActual?.nombre ?? ""}
          seleccionado={seleccionado}
          onSelect={handleSeleccionar}
        />

        {seleccionado && fecha && (
          <div className={styles.accionReserva}>
            <ReservationSummary
              canchaNombre={canchaActual?.nombre ?? ""}
              fechaTexto={formatFechaLarga(fecha)}
              horaTexto={`${seleccionado.inicio} – ${seleccionado.fin}`}
            />

            <div className={styles.accionFila}>
              <Button size="lg" onClick={handleReservar}>
                Reservar
              </Button>
            </div>

            {avisoSesion && !usuario && (
              <Alert variant="warning" title="Necesitás iniciar sesión">
                <span className={styles.avisoContenido}>
                  {apiHabilitada()
                    ? "Para reservar necesitás iniciar sesión."
                    : "Para reservar necesitás una sesión de demostración activa."}
                  <Button href="/login" size="sm" variant="outline">
                    Iniciar sesión
                  </Button>
                </span>
              </Alert>
            )}
          </div>
        )}
      </section>

      {modalDatos && (
        <ReservationModal
          datos={modalDatos}
          onResultado={handleResultadoReserva}
          onCerrar={() => setModalDatos(null)}
        />
      )}
    </div>
  );
}
