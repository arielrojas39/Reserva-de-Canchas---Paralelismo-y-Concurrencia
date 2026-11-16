"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, Button, EmptyState, Modal, Skeleton } from "@/components/ui";
import { CourtForm } from "@/features/admin/CourtForm";
import { CourtAdminCard } from "@/features/admin/CourtAdminCard";
import { CreateCourtModal } from "@/features/admin/CreateCourtModal";
import {
  actualizarCancha,
  crearCancha,
  eliminarCancha,
  obtenerCanchasAdmin,
} from "@/lib/services/canchas.service";
import type { DatosCanchaForm } from "@/lib/services/canchas.service";
import { obtenerHorariosPorCancha } from "@/lib/services/horarios.service";
import type { Cancha } from "@/types";
import styles from "./CanchasSection.module.scss";

interface DatosSeccion {
  canchas: Cancha[];
  horarios: Record<string, string[]>;
}

/** Sección administrativa de canchas conectada a la API. */
export function CanchasSection() {
  const [datos, setDatos] = useState<DatosSeccion | null>(null);
  const [revision, setRevision] = useState(0);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Cancha | null>(null);
  const [eliminando, setEliminando] = useState<Cancha | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([obtenerCanchasAdmin(), obtenerHorariosPorCancha()])
      .then(([canchas, horarios]) => {
        if (!cancelado) {
          setDatos({ canchas, horarios });
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelado) setError("No se pudieron cargar las canchas. Intentá nuevamente.");
      });

    return () => {
      cancelado = true;
    };
  }, [revision]);

  const refrescar = () => {
    setRevision((valor) => valor + 1);
  };

  const handleCrear = async (valores: DatosCanchaForm) => crearCancha(valores);

  const handleEliminar = async () => {
    if (!eliminando || guardando) return;
    setGuardando(true);
    try {
      await eliminarCancha(eliminando.id);
      setDatos((actual) =>
        actual
          ? { ...actual, canchas: actual.canchas.filter((cancha) => cancha.id !== eliminando.id) }
          : actual,
      );
      setEliminando(null);
      toast.success("Cancha eliminada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la cancha.");
    } finally {
      setGuardando(false);
    }
  };

  const handleCreada = () => {
    setCreando(false);
    toast.success("Cancha creada", {
      description: "Ya aparece en el listado y en el catálogo público.",
    });
    refrescar();
  };

  return (
    <>
      <div className={styles.toolbar}>
        <h2 className={styles.titulo}>Canchas y horarios</h2>
        <Button onClick={() => setCreando(true)}>
          <Plus size={16} aria-hidden="true" />
          Nueva cancha
        </Button>
      </div>

      {error ? (
        <Alert variant="error" title="Error al cargar">
          {error} <Button onClick={refrescar}>Reintentar</Button>
        </Alert>
      ) : !datos ? (
        <div className={styles.cargando} aria-busy="true">
          <Skeleton height="220px" radius="14px" />
          <Skeleton height="220px" radius="14px" />
        </div>
      ) : datos.canchas.length === 0 ? (
        <EmptyState
          title="No hay canchas cargadas"
          description="Creá la primera cancha para empezar a recibir reservas."
          action={
            <Button onClick={() => setCreando(true)}>
              <Plus size={16} aria-hidden="true" />
              Nueva cancha
            </Button>
          }
        />
      ) : (
        <ul className={styles.lista} aria-label="Canchas cargadas">
          {datos.canchas.map((cancha) => (
            <li key={cancha.id}>
              <CourtAdminCard
                cancha={cancha}
                horarios={datos.horarios[cancha.id] ?? []}
                onCambioHorarios={refrescar}
                onEditar={() => setEditando(cancha)}
                onEliminar={() => setEliminando(cancha)}
              />
            </li>
          ))}
        </ul>
      )}

      {creando && (
        <CreateCourtModal
          onCrear={handleCrear}
          onCreada={handleCreada}
          onCerrar={() => setCreando(false)}
        />
      )}
      {editando && (
        <Modal
          open
          title="Editar cancha"
          onClose={() => {
            if (!guardando) setEditando(null);
          }}
        >
          <CourtForm
            inicial={editando}
            onCrear={async (valores) => {
              setGuardando(true);
              try {
                return await actualizarCancha(editando.id, valores);
              } finally {
                setGuardando(false);
              }
            }}
            onCreada={() => {
              setEditando(null);
              toast.success("Cancha actualizada");
              refrescar();
            }}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}
      {eliminando && (
        <Modal
          open
          title="Eliminar cancha"
          onClose={() => {
            if (!guardando) setEliminando(null);
          }}
          footer={
            <>
              <Button variant="outline" disabled={guardando} onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button isLoading={guardando} onClick={handleEliminar}>
                Eliminar cancha
              </Button>
            </>
          }
        >
          <p>
            ¿Eliminar «{eliminando.nombre}»? Dejará de estar disponible para nuevas reservas. Se
            conserva el historial de reservas.
          </p>
        </Modal>
      )}
    </>
  );
}
