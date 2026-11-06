"use client";

import { Play } from "lucide-react";
import { toast } from "sonner";
import { Alert, Badge, Button, Card } from "@/components/ui";
import {
  guardarConfigDemo,
  type ConfigDemo,
  type EscenarioPago,
  type EscenarioReserva,
} from "@/lib/services/demo.config";
import styles from "./DemoScenarioSelector.module.scss";

interface Escenario {
  valor: EscenarioReserva | EscenarioPago;
  titulo: string;
  descripcion: string;
  /** Código de respuesta simulada que ejercita. */
  codigo: string;
}

const ESCENARIOS_RESERVA: Escenario[] = [
  {
    valor: "auto",
    titulo: "Automática",
    descripcion: "El flujo elige el resultado según los datos (201 o 409).",
    codigo: "201/409",
  },
  {
    valor: "exitosa",
    titulo: "Reserva exitosa",
    descripcion: "La reserva se crea y queda pendiente de pago.",
    codigo: "201",
  },
  {
    valor: "conflicto",
    titulo: "Conflicto de horario",
    descripcion: "El horario ya fue tomado por otra reserva.",
    codigo: "409",
  },
  {
    valor: "ocupado",
    titulo: "Servicio ocupado",
    descripcion: "El servicio simulado no está disponible.",
    codigo: "503",
  },
  {
    valor: "expirada",
    titulo: "Reserva expirada",
    descripcion: "La reserva venció antes de confirmarse.",
    codigo: "410",
  },
];

const ESCENARIOS_PAGO: Escenario[] = [
  {
    valor: "auto",
    titulo: "Automático",
    descripcion: "El selector de pago arranca en «Pago aprobado».",
    codigo: "200",
  },
  {
    valor: "aprobado",
    titulo: "Pago aprobado",
    descripcion: "El pago confirma la reserva.",
    codigo: "200",
  },
  {
    valor: "rechazado",
    titulo: "Pago rechazado",
    descripcion: "El pago se rechaza y la reserva queda cancelada.",
    codigo: "402",
  },
];

export interface DemoScenarioSelectorProps {
  /** Configuración vigente (controlada por el padre). */
  config: ConfigDemo;
  /** Se ejecuta tras aplicar un escenario, para refrescar el padre. */
  onCambio?: () => void;
}

/**
 * Selector de escenarios predefinidos (demo). Cada opción escribe el
 * escenario en la configuración; los modales de reserva y pago lo usan
 * como valor inicial de su selector de simulación existente. No toca la
 * lógica de los componentes de producción.
 */
export function DemoScenarioSelector({ config, onCambio }: DemoScenarioSelectorProps) {
  const aplicarReserva = (valor: EscenarioReserva) => {
    guardarConfigDemo({ escenarioReserva: valor });
    toast.success(`Escenario de reserva: ${valor}`);
    onCambio?.();
  };

  const aplicarPago = (valor: EscenarioPago) => {
    guardarConfigDemo({ escenarioPago: valor });
    toast.success(`Escenario de pago: ${valor}`);
    onCambio?.();
  };

  return (
    <Card className={styles.card}>
      <h3 className={styles.titulo}>Escenarios predefinidos</h3>
      <p className={styles.texto}>
        Elegí qué respuesta simulada querés exponer. El escenario se aplica como valor inicial del
        selector de simulación del modal de reserva o de pago (en «Mis reservas» y en el catálogo):
        no modifica los componentes de producción ni envía nada a servicios externos.
      </p>

      <section aria-labelledby="escenarios-reserva-title">
        <h4 id="escenarios-reserva-title" className={styles.subtitulo}>
          Flujo de reserva
        </h4>
        <ul className={styles.grilla} aria-label="Escenarios de reserva">
          {ESCENARIOS_RESERVA.map((escenario) => {
            const activo = config.escenarioReserva === escenario.valor;
            return (
              <li key={escenario.valor}>
                <button
                  type="button"
                  aria-pressed={activo}
                  className={activo ? styles.opcionActiva : styles.opcion}
                  onClick={() => aplicarReserva(escenario.valor as EscenarioReserva)}
                >
                  <span className={styles.opcionHeader}>
                    <span className={styles.opcionTitulo}>{escenario.titulo}</span>
                    <Badge variant={activo ? "success" : "neutral"}>{escenario.codigo}</Badge>
                  </span>
                  <span className={styles.opcionDesc}>{escenario.descripcion}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="escenarios-pago-title">
        <h4 id="escenarios-pago-title" className={styles.subtitulo}>
          Flujo de pago
        </h4>
        <ul className={styles.grilla} aria-label="Escenarios de pago">
          {ESCENARIOS_PAGO.map((escenario) => {
            const activo = config.escenarioPago === escenario.valor;
            return (
              <li key={escenario.valor}>
                <button
                  type="button"
                  aria-pressed={activo}
                  className={activo ? styles.opcionActiva : styles.opcion}
                  onClick={() => aplicarPago(escenario.valor as EscenarioPago)}
                >
                  <span className={styles.opcionHeader}>
                    <span className={styles.opcionTitulo}>{escenario.titulo}</span>
                    <Badge variant={activo ? "success" : "neutral"}>{escenario.codigo}</Badge>
                  </span>
                  <span className={styles.opcionDesc}>{escenario.descripcion}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Alert variant="info" title="Cómo exponer un escenario">
        <span className={styles.expo}>
          Guardá el escenario y luego ejecutalo en el flujo correspondiente: crear una reserva desde{" "}
          <strong>Canchas</strong> o pagar desde <strong>Mis reservas</strong>.
          <Button href="/canchas" size="sm" variant="outline">
            <Play size={14} aria-hidden="true" />
            Ir al catálogo
          </Button>
        </span>
      </Alert>
    </Card>
  );
}
