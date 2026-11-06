"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Input } from "@/components/ui";
import { courtSchema, type CourtFormValues } from "@/features/admin/admin.schemas";
import type { DatosCanchaForm, ResultadoCreacionCancha } from "@/lib/services/canchas.service";
import styles from "./CourtForm.module.scss";

export interface CourtFormProps {
  onCrear: (datos: DatosCanchaForm) => Promise<ResultadoCreacionCancha>;
  /** Se ejecuta tras una creación exitosa (cierra y refresca). */
  onCreada: () => void;
  onCancelar: () => void;
  inicial?: DatosCanchaForm;
}

/**
 * Formulario de alta de cancha (demo): nombre, descripción y estado.
 * El error del servicio (ej.: nombre duplicado) se muestra como alert.
 */
export function CourtForm({ onCrear, onCreada, onCancelar, inicial }: CourtFormProps) {
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourtFormValues>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      nombre: inicial?.nombre ?? "",
      descripcion: inicial?.descripcion ?? "",
      estado: inicial?.activa === false ? "inactivo" : "activo",
      ...(inicial ? { precioPorHora: inicial.precioPorHora } : {}),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorServidor(undefined);
    const resultado = await onCrear({
      nombre: values.nombre,
      descripcion: values.descripcion,
      // El select entrega strings: se convierte al booleano en el límite.
      activa: values.estado === "activo",
      ...(inicial ? { precioPorHora: values.precioPorHora } : {}),
    });

    if (!resultado.ok) {
      setErrorServidor(resultado.error);
      return;
    }

    onCreada();
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errorServidor && (
        <Alert variant="error" title="No pudimos guardar la cancha">
          {errorServidor}
        </Alert>
      )}

      <Input
        label="Nombre"
        required
        placeholder="Ej.: Fútbol 5 Los Álamos"
        invalid={Boolean(errors.nombre)}
        error={errors.nombre?.message}
        {...register("nombre")}
      />

      <Input
        label="Descripción"
        required
        hint="Breve descripción para el catálogo público."
        placeholder="Cancha de césped sintético con iluminación…"
        invalid={Boolean(errors.descripcion)}
        error={errors.descripcion?.message}
        {...register("descripcion")}
      />

      {inicial && (
        <Input
          label="Precio por hora (ARS)"
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          required
          invalid={Boolean(errors.precioPorHora)}
          error={errors.precioPorHora?.message}
          {...register("precioPorHora", { valueAsNumber: true })}
        />
      )}

      <div className={styles.campo}>
        <label htmlFor="cancha-estado" className={styles.label}>
          Estado
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        </label>
        <select
          id="cancha-estado"
          className={styles.select}
          aria-invalid={Boolean(errors.estado) || undefined}
          {...register("estado")}
        >
          <option value="activo">Activa (visible en el catálogo)</option>
          <option value="inactivo">Inactiva (oculta en el catálogo)</option>
        </select>
        {errors.estado && (
          <p className={styles.error} role="alert">
            {errors.estado.message}
          </p>
        )}
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {inicial ? "Guardar cambios" : "Crear cancha"}
        </Button>
      </div>
    </form>
  );
}
