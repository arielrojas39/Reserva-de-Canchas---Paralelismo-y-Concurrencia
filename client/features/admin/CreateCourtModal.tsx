"use client";

import { Modal } from "@/components/ui";
import { CourtForm } from "@/features/admin/CourtForm";
import type { DatosCanchaForm, ResultadoCreacionCancha } from "@/lib/services/canchas.service";

export interface CreateCourtModalProps {
  onCrear: (datos: DatosCanchaForm) => Promise<ResultadoCreacionCancha>;
  onCreada: () => void;
  onCerrar: () => void;
}

/** Modal de alta de cancha (demo) con el formulario validado. */
export function CreateCourtModal({ onCrear, onCreada, onCerrar }: CreateCourtModalProps) {
  return (
    <Modal open onClose={onCerrar} title="Nueva cancha">
      <CourtForm onCrear={onCrear} onCreada={onCreada} onCancelar={onCerrar} />
    </Modal>
  );
}
