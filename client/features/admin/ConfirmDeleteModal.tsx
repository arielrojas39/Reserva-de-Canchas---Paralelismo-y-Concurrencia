"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import styles from "./ConfirmDeleteModal.module.scss";

export interface ConfirmDeleteModalProps {
  titulo: string;
  mensaje: string;
  /** Ejecuta la eliminación; el modal muestra el estado de guardado. */
  onConfirmar: () => Promise<{ ok: boolean; error?: string }>;
  /** Se ejecuta tras una eliminación exitosa (cierra y refresca). */
  onEliminado: () => void;
  onCerrar: () => void;
}

/** Modal de confirmación reutilizable para acciones destructivas (demo). */
export function ConfirmDeleteModal({
  titulo,
  mensaje,
  onConfirmar,
  onEliminado,
  onCerrar,
}: ConfirmDeleteModalProps) {
  const [error, setError] = useState<string | undefined>();
  const [cargando, setCargando] = useState(false);

  const cerrar = () => {
    if (cargando) return;
    onCerrar();
  };

  const confirmar = async () => {
    if (cargando) return;
    setCargando(true);
    setError(undefined);

    const resultado = await onConfirmar();

    setCargando(false);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo completar la operación.");
      return;
    }

    onEliminado();
  };

  return (
    <Modal
      open
      onClose={cerrar}
      title={titulo}
      footer={
        <>
          <Button variant="outline" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmar} isLoading={cargando}>
            <Trash2 size={16} aria-hidden="true" />
            Eliminar
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" title="No se pudo eliminar">
          {error}
        </Alert>
      )}
      <p className={styles.mensaje}>{mensaje}</p>
    </Modal>
  );
}
