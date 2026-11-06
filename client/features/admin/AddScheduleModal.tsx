"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Input, Modal } from "@/components/ui";
import { horarioSchema, type HorarioFormValues } from "@/features/admin/admin.schemas";
import type { ResultadoHorario } from "@/lib/services/horarios.service";
import styles from "./AddScheduleModal.module.scss";

export interface AddScheduleModalProps {
  canchaNombre: string;
  /** Horarios ya habilitados, para evitar duplicados en el formulario. */
  existentes: string[];
  onAgregar: (inicio: string) => Promise<ResultadoHorario>;
  /** Se ejecuta tras un alta exitosa (cierra y refresca). */
  onAgregado: () => void;
  onCerrar: () => void;
}

/** Modal de alta de horario (demo): hora de inicio HH:MM, franja de 1h. */
export function AddScheduleModal({
  canchaNombre,
  existentes,
  onAgregar,
  onAgregado,
  onCerrar,
}: AddScheduleModalProps) {
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<HorarioFormValues>({
    resolver: zodResolver(horarioSchema),
    defaultValues: { inicio: "18:00" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(undefined);

    if (existentes.includes(values.inicio)) {
      setError("inicio", { message: "Ese horario ya está habilitado en esta cancha." });
      return;
    }

    const resultado = await onAgregar(values.inicio);

    if (!resultado.ok) {
      setErrorServidor(resultado.error);
      return;
    }

    onAgregado();
  });

  return (
    <Modal open onClose={onCerrar} title={`Agregar horario — ${canchaNombre}`}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {errorServidor && (
          <Alert variant="error" title="No pudimos agregar el horario">
            {errorServidor}
          </Alert>
        )}

        <Input
          label="Hora de inicio"
          required
          type="time"
          step={3600}
          hint="La franja dura una hora (ej.: 18:00 → 18:00–19:00)."
          invalid={Boolean(errors.inicio)}
          error={errors.inicio?.message}
          {...register("inicio")}
        />

        <div className={styles.acciones}>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Agregar horario
          </Button>
        </div>
      </form>
    </Modal>
  );
}
