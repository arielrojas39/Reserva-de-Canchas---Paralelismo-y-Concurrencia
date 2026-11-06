"use client";

import { useRef, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { LoadingState } from "@/features/reservas/LoadingState";
import { ReservationFeedback } from "@/features/reservas/ReservationFeedback";
import { ReservationSummary } from "@/features/reservas/ReservationSummary";
import { leerConfigDemo, type EscenarioReserva } from "@/lib/services/demo.config";
import { apiHabilitada } from "@/lib/api/config";
import {
  crearReserva,
  type CodigoRespuesta,
  type DatosReservaDemo,
  type ModoSimulacion,
  type ResultadoReserva,
} from "@/lib/services/reservas.service";
import { formatFechaLarga } from "@/lib/utils/fecha";
import styles from "./ReservationModal.module.scss";

export interface ReservationModalProps {
  /** Datos de la reserva pendiente (snapshot al abrir). */
  datos: DatosReservaDemo;
  /** Se notifica con cada respuesta (para refrescar la disponibilidad). */
  onResultado: (codigo: CodigoRespuesta) => void;
  onCerrar: () => void;
}

type Fase = "confirmar" | "cargando" | "resultado";

const OPCIONES_MODO: Array<{ valor: ModoSimulacion; texto: string }> = [
  { valor: "auto", texto: "Automática (201 o 409)" },
  { valor: 201, texto: "201 — Reserva exitosa" },
  { valor: 409, texto: "409 — Conflicto" },
  { valor: 410, texto: "410 — Reserva vencida" },
  { valor: 422, texto: "422 — Datos inválidos" },
  { valor: 503, texto: "503 — Servicio ocupado" },
];

/** Escenario predefinido del panel admin → modo del selector existente. */
const MODO_POR_ESCENARIOS: Record<EscenarioReserva, ModoSimulacion> = {
  auto: "auto",
  exitosa: 201,
  conflicto: 409,
  ocupado: 503,
  expirada: 410,
};

/**
 * Modal de confirmación de reserva (demo). Fases:
 * confirmar → cargando → resultado (feedback por código de respuesta).
 * El guard por ref + el botón isLoading evitan envíos por doble clic.
 */
export function ReservationModal({ datos, onResultado, onCerrar }: ReservationModalProps) {
  const [fase, setFase] = useState<Fase>("confirmar");
  const [resultado, setResultado] = useState<ResultadoReserva | null>(null);
  // Valor inicial del selector: el escenario predefinido en /admin/configuracion.
  const [modo, setModo] = useState<ModoSimulacion>(() =>
    apiHabilitada() ? "auto" : MODO_POR_ESCENARIOS[leerConfigDemo().escenarioReserva],
  );
  const enviandoRef = useRef(false);

  const cargando = fase === "cargando";

  const cerrar = () => {
    if (cargando) return;
    onCerrar();
  };

  const confirmar = async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setFase("cargando");

    const respuesta = await crearReserva(datos, modo);

    enviandoRef.current = false;
    setResultado(respuesta);
    setFase("resultado");
    onResultado(respuesta.codigo);
  };

  const reintentar = () => {
    setResultado(null);
    setFase("confirmar");
  };

  return (
    <Modal
      open
      onClose={cerrar}
      title={fase === "resultado" ? "Resultado de la reserva" : "Confirmar reserva"}
      footer={
        fase !== "resultado" ? (
          <>
            <Button variant="outline" onClick={cerrar} disabled={cargando}>
              Cancelar
            </Button>
            <Button onClick={confirmar} isLoading={cargando}>
              Confirmar reserva
            </Button>
          </>
        ) : undefined
      }
    >
      {fase === "cargando" ? (
        <LoadingState mensaje="Confirmando tu reserva…" />
      ) : fase === "resultado" && resultado ? (
        <ReservationFeedback
          resultado={resultado}
          datos={datos}
          onReintentar={reintentar}
          onCerrar={onCerrar}
        />
      ) : (
        <>
          <ReservationSummary
            canchaNombre={datos.canchaNombre}
            fechaTexto={formatFechaLarga(datos.fecha)}
            horaTexto={`${datos.inicio} – ${datos.fin}`}
          />

          {apiHabilitada() ? (
            <p className={styles.simulacionHint} role="status">
              Reserva real contra el backend. El pago todavía no está integrado.
            </p>
          ) : (
            <div className={styles.simulacion}>
              <label htmlFor="modo-simulacion" className={styles.simulacionLabel}>
                Respuesta simulada (solo demo)
              </label>
              <select
                id="modo-simulacion"
                className={styles.select}
                value={modo}
                onChange={(event) => {
                  const valor = event.target.value;
                  // El select entrega strings: se convierte al código numérico.
                  setModo(valor === "auto" ? "auto" : (Number(valor) as ModoSimulacion));
                }}
              >
                {OPCIONES_MODO.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
              <p className={styles.simulacionHint}>
                No se envía nada a ningún servicio: elige qué respuesta querés probar en la
                interfaz.
              </p>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
