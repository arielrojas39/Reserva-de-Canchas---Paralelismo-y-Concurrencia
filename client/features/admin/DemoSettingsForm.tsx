"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input, Switch } from "@/components/ui";
import { SettingField } from "@/features/admin/SettingField";
import { demoConfigSchema, type DemoConfigValues } from "@/features/admin/admin.schemas";
import {
  CONFIG_DEMO_DEFECTO,
  guardarConfigDemo,
  leerConfigDemo,
  restablecerConfigDemo,
} from "@/lib/services/demo.config";
import styles from "./DemoSettingsForm.module.scss";

export interface DemoSettingsFormProps {
  /** Se ejecuta tras guardar o restablecer, para refrescar el padre. */
  onCambio?: () => void;
}

/**
 * Formulario de parámetros visuales de la demostración: semáforos
 * (control simulado), latencia y retención de reservas. Solo administra
 * la configuración del entorno mock; no hay concurrencia real.
 */
export function DemoSettingsForm({ onCambio }: DemoSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DemoConfigValues>({
    resolver: zodResolver(demoConfigSchema),
  });

  const semaforos = useWatch({ control, name: "semaforos" });

  // Hidrata el form con la configuración vigente (una sola vez).
  useEffect(() => {
    reset(leerConfigDemo());
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    guardarConfigDemo(values);
    toast.success("Configuración guardada (demo)", {
      description: "Los parámetros se aplican a la simulación de este navegador.",
    });
    onCambio?.();
  });

  const handleRestablecer = () => {
    restablecerConfigDemo();
    reset(CONFIG_DEMO_DEFECTO);
    toast.success("Valores restablecidos (demo)");
    onCambio?.();
  };

  // El switch se aplica al instante (además de quedar reflejado en el form).
  const handleSemaforos = (checked: boolean) => {
    setValue("semaforos", checked);
    guardarConfigDemo({ semaforos: checked });
    onCambio?.();
  };

  return (
    <Card className={styles.card}>
      <h3 className={styles.titulo}>Parámetros de la demostración</h3>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <SettingField
          titulo="Uso de semáforos"
          descripcion="El modo de semáforos representa un escenario de control de solicitudes simultáneas. En esta versión frontend se muestran únicamente resultados simulados: activado, reservar un horario ya tomado responde conflicto (409); desactivado, la demo no marca ese control."
        >
          <Switch
            label={semaforos ? "Activado" : "Desactivado"}
            checked={semaforos}
            onChange={handleSemaforos}
          />
        </SettingField>

        <SettingField
          titulo="Latencia simulada (ms)"
          descripcion="Retardo ficticio aplicado a las respuestas del servicio simulado (ingreso, reserva, pago, disponibilidad). Con 0 se usan los retardos por defecto de cada flujo."
        >
          <div className={styles.inputNumerico}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              step={100}
              aria-label="Latencia simulada en milisegundos"
              invalid={Boolean(errors.latenciaSimuladaMs)}
              error={errors.latenciaSimuladaMs?.message}
              {...register("latenciaSimuladaMs", { valueAsNumber: true })}
            />
          </div>
        </SettingField>

        <SettingField
          titulo="Tiempo de retención de una reserva (min)"
          descripcion="Minutos que una reserva recién creada permanece pendiente de pago antes de expirar en la demostración."
        >
          <div className={styles.inputNumerico}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              aria-label="Tiempo de retención en minutos"
              invalid={Boolean(errors.retencionReservaMin)}
              error={errors.retencionReservaMin?.message}
              {...register("retencionReservaMin", { valueAsNumber: true })}
            />
          </div>
        </SettingField>

        <div className={styles.acciones}>
          <Button type="button" variant="outline" onClick={handleRestablecer}>
            <RotateCcw size={16} aria-hidden="true" />
            Restablecer valores
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Save size={16} aria-hidden="true" />
            Guardar configuración
          </Button>
        </div>
      </form>
    </Card>
  );
}
