"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Alert, Button, EmptyState, Modal } from "@/components/ui";
import { LoadingState } from "@/features/reservas/LoadingState";
import { PaymentModal } from "@/features/reservas/PaymentModal";
import { ReservationCard } from "@/features/reservas/ReservationCard";
import { useSession } from "@/contexts/SessionContext";
import { formatFechaLarga } from "@/lib/utils/fecha";
import {
  cancelarReservaApiPorId,
  expirarReserva,
  obtenerReservasDeUsuario,
  type ReservaVista,
} from "@/lib/services/reservas.service";
import { iniciarPagoMercadoPago } from "@/lib/services/pagos.service";
import styles from "./ReservationList.module.scss";
import { apiHabilitada } from "@/lib/api/config";

/**
 * Listado de "Mis reservas": consulta el store de demostración y
 * orquesta expiraciones y pagos. El estado de carga se DERIVA de si
 * el resultado corresponde al usuario activo (sin setState síncronos
 * en efectos); `revision` refresca tras cada transición.
 */
export function ReservationList() {
  const { usuario } = useSession();
  const [resultado, setResultado] = useState<{
    usuarioId: string;
    vistas: ReservaVista[];
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const [pagoPendiente, setPagoPendiente] = useState<ReservaVista | null>(null);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [cancelarPendiente, setCancelarPendiente] = useState<ReservaVista | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<{ usuarioId: string; mensaje: string } | null>(null);

  const usuarioId = usuario?.id ?? null;
  const vistas = resultado?.usuarioId === usuarioId ? resultado.vistas : null;
  const mensajeError = errorCarga?.usuarioId === usuarioId ? errorCarga.mensaje : null;
  const cargando = usuarioId !== null && vistas === null && mensajeError === null;

  useEffect(() => {
    if (!usuarioId) return;
    let cancelado = false;

    obtenerReservasDeUsuario(usuarioId)
      .then((vistasObtenidas) => {
        if (cancelado) return;
        setErrorCarga(null);
        setResultado({ usuarioId, vistas: vistasObtenidas });
      })
      .catch(() => {
        if (cancelado) return;
        setErrorCarga({
          usuarioId,
          mensaje: "No se pudieron cargar tus reservas. Intentá nuevamente.",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId, revision]);

  // Vuelta desde Checkout Pro: avisa el resultado y refresca mientras el
  // webhook confirma el pago en el backend.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get("pago");
    if (!pago) return;

    if (pago === "exito") {
      toast.success("Pago aprobado", {
        description: "Estamos confirmando la reserva con Mercado Pago.",
      });
    } else if (pago === "pendiente") {
      toast.info("Pago pendiente", {
        description: "Cuando Mercado Pago lo apruebe, la reserva se confirmará.",
      });
    } else {
      toast.error("El pago no se completó", {
        description: "La reserva sigue pendiente para que puedas reintentar.",
      });
    }

    window.history.replaceState({}, "", "/mis-reservas");

    if (pago === "error") return;
    const refrescoInicial = window.setTimeout(() => setRevision((valor) => valor + 1), 0);
    const intervalo = window.setInterval(() => setRevision((valor) => valor + 1), 4_000);
    const limite = window.setTimeout(() => window.clearInterval(intervalo), 24_000);
    return () => {
      window.clearTimeout(refrescoInicial);
      window.clearInterval(intervalo);
      window.clearTimeout(limite);
    };
  }, []);

  const handleExpirada = (reservaId: string) => {
    // La expiración se persiste y libera el horario en el store.
    void expirarReserva(reservaId).then(() => {
      setRevision((valor) => valor + 1);
    });
  };

  const handleResultadoPago = () => {
    setRevision((valor) => valor + 1);
  };

  const handlePagar = async (vista: ReservaVista) => {
    if (!apiHabilitada()) {
      setPagoPendiente(vista);
      return;
    }

    setPagandoId(vista.reserva.id);
    const resultado = await iniciarPagoMercadoPago(vista.reserva.id);
    if (!resultado.ok) {
      setPagandoId(null);
      toast.error("No se pudo iniciar el pago", { description: resultado.error });
      return;
    }
    window.location.assign(resultado.checkoutUrl);
  };

  const confirmarCancelacion = async () => {
    if (!cancelarPendiente || cancelando) return;
    setCancelando(true);
    try {
      await cancelarReservaApiPorId(cancelarPendiente.reserva.id);
      toast.success("Reserva cancelada", {
        description: "El horario vuelve a estar disponible.",
      });
      setCancelarPendiente(null);
      setRevision((valor) => valor + 1);
    } catch (error) {
      toast.error("No se pudo cancelar la reserva", {
        description:
          error instanceof Error && error.message
            ? error.message
            : "Intentá nuevamente en unos segundos.",
      });
    } finally {
      setCancelando(false);
    }
  };

  if (!usuario) return null;

  if (cargando) {
    return <LoadingState mensaje="Cargando tus reservas…" />;
  }

  if (mensajeError) {
    return (
      <Alert variant="error" title="No se pudieron cargar tus reservas">
        {mensajeError}{" "}
        <Button variant="outline" size="sm" onClick={() => setRevision((value) => value + 1)}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (vistas && vistas.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={32} />}
        title="Todavía no tenés reservas"
        description={
          apiHabilitada()
            ? "Elegí una cancha y un horario desde el catálogo para crear tu primera reserva."
            : "Elegí una cancha y un horario desde el catálogo para crear tu primera reserva de demostración."
        }
        action={<Button href="/canchas">Explorar canchas</Button>}
      />
    );
  }

  return (
    <>
      <ul className={styles.grid} aria-label="Tus reservas">
        {vistas?.map((vista) => (
          <li key={vista.reserva.id}>
            <ReservationCard
              vista={vista}
              onPagar={handlePagar}
              onExpirada={handleExpirada}
              onCancelar={setCancelarPendiente}
              pagoDisponible
              pagoReal={apiHabilitada()}
              pagoEnCurso={pagandoId === vista.reserva.id}
              cancelacionDisponible={apiHabilitada()}
            />
          </li>
        ))}
      </ul>

      {pagoPendiente && !apiHabilitada() && (
        <PaymentModal
          vista={pagoPendiente}
          onResultado={handleResultadoPago}
          onCerrar={() => setPagoPendiente(null)}
        />
      )}

      {cancelarPendiente && (
        <Modal
          open
          onClose={() => {
            if (!cancelando) setCancelarPendiente(null);
          }}
          title="Cancelar reserva"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setCancelarPendiente(null)}
                disabled={cancelando}
              >
                Volver
              </Button>
              <Button variant="danger" onClick={confirmarCancelacion} isLoading={cancelando}>
                Cancelar reserva
              </Button>
            </>
          }
        >
          <p>
            ¿Querés cancelar la reserva de <strong>{cancelarPendiente.cancha?.nombre}</strong> para
            el {formatFechaLarga(cancelarPendiente.reserva.fecha)}
            {cancelarPendiente.reserva.inicio ? ` a las ${cancelarPendiente.reserva.inicio}` : ""}?
          </p>
          <p>El horario volverá a estar disponible para otras personas.</p>
        </Modal>
      )}
    </>
  );
}
