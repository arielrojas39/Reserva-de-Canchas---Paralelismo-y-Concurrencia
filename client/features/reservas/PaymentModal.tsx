"use client";

import { useRef, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { LoadingState } from "@/features/reservas/LoadingState";
import { PaymentFeedback } from "@/features/reservas/PaymentFeedback";
import { ReservationSummary } from "@/features/reservas/ReservationSummary";
import { leerConfigDemo, type EscenarioPago } from "@/lib/services/demo.config";
import {
  pagarReservaDemo,
  type CodigoPago,
  type ModoPago,
  type ResultadoPago,
} from "@/lib/services/pagos.service";
import type { DatosReservaDemo, ReservaVista } from "@/lib/services/reservas.service";
import { formatFechaLarga } from "@/lib/utils/fecha";
import styles from "./PaymentModal.module.scss";

export interface PaymentModalProps {
  /** Vista de la reserva que se quiere pagar (snapshot). */
  vista: ReservaVista;
  /** Cada respuesta permite refrescar la lista. */
  onResultado: (codigo: CodigoPago) => void;
  onCerrar: () => void;
}

type Fase = "confirmar" | "cargando" | "resultado";

const OPCIONES_MODO: Array<{ valor: ModoPago; texto: string }> = [
  { valor: "aprobado", texto: "Pago aprobado" },
  { valor: "rechazado", texto: "Pago rechazado" },
  { valor: "error", texto: "Error simulado" },
];

/** Escenario predefinido del panel admin → modo del selector existente. */
const MODO_POR_ESCENARIOS: Record<EscenarioPago, ModoPago> = {
  auto: "aprobado",
  aprobado: "aprobado",
  rechazado: "rechazado",
};

function datosDe(vista: ReservaVista): DatosReservaDemo {
  return {
    canchaId: vista.reserva.canchaId,
    canchaNombre: vista.cancha?.nombre ?? "Cancha",
    horarioId: vista.reserva.horarioId,
    fecha: vista.reserva.fecha,
    inicio: vista.reserva.inicio ?? "—",
    fin: vista.reserva.fin ?? "—",
    montoTotal: vista.reserva.montoTotal,
    usuarioId: vista.reserva.usuarioId,
  };
}

/**
 * Modal de pago simulado: sin datos bancarios ni cobros reales.
 * Fases: confirmar → cargando → resultado. El guard por ref + el botón
 * isLoading evitan envíos por doble clic.
 */
export function PaymentModal({ vista, onResultado, onCerrar }: PaymentModalProps) {
  const [fase, setFase] = useState<Fase>("confirmar");
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  // Valor inicial del selector: el escenario predefinido en /admin/configuracion.
  const [modo, setModo] = useState<ModoPago>(
    () => MODO_POR_ESCENARIOS[leerConfigDemo().escenarioPago],
  );
  const enviandoRef = useRef(false);

  const cargando = fase === "cargando";
  const datos = datosDe(vista);

  const cerrar = () => {
    if (cargando) return;
    onCerrar();
  };

  const confirmar = async () => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setFase("cargando");

    const respuesta = await pagarReservaDemo(vista.reserva.id, modo);

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
      title={fase === "resultado" ? "Resultado del pago" : "Pago de la reserva"}
      footer={
        fase !== "resultado" ? (
          <>
            <Button variant="outline" onClick={cerrar} disabled={cargando}>
              Cancelar
            </Button>
            <Button onClick={confirmar} isLoading={cargando}>
              Confirmar pago
            </Button>
          </>
        ) : undefined
      }
    >
      {fase === "cargando" ? (
        <LoadingState mensaje="Procesando el pago…" />
      ) : fase === "resultado" && resultado ? (
        <PaymentFeedback
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
            estado={vista.reserva.estado}
            importe={vista.reserva.montoTotal}
          />

          <p className={styles.avisoDemo} role="note">
            <strong>Pago de demostración</strong> — no se realiza ningún cobro real. No se solicitan
            datos bancarios ni tarjetas.
          </p>

          <div className={styles.simulacion}>
            <label htmlFor="modo-pago" className={styles.simulacionLabel}>
              Simulación de resultado
            </label>
            <select
              id="modo-pago"
              className={styles.select}
              value={modo}
              onChange={(event) => setModo(event.target.value as ModoPago)}
            >
              {OPCIONES_MODO.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </Modal>
  );
}
