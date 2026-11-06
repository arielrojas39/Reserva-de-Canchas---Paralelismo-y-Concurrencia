"use client";

import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, Button, Card } from "@/components/ui";
import { DemoScenarioSelector } from "@/features/admin/DemoScenarioSelector";
import { DemoSettingsForm } from "@/features/admin/DemoSettingsForm";
import { leerConfigDemo } from "@/lib/services/demo.config";
import { CLAVES_DEMO } from "@/lib/services/demo.store";
import styles from "./ConfiguracionSection.module.scss";

/**
 * Configuración de la demostración: parámetros visuales (semáforos,
 * latencia, retención), escenarios predefinidos y reinicio de los
 * datos ficticios almacenados localmente. La config vigente se lifting
 * aquí para que form y escenarios queden sincronizados.
 */
export function ConfiguracionSection() {
  const [config, setConfig] = useState(() => leerConfigDemo());

  const refrescar = useCallback(() => setConfig(leerConfigDemo()), []);

  const handleReiniciar = () => {
    try {
      window.localStorage.removeItem(CLAVES_DEMO.reservas);
      window.localStorage.removeItem(CLAVES_DEMO.horariosReservados);
      window.localStorage.removeItem(CLAVES_DEMO.canchas);
      window.localStorage.removeItem(CLAVES_DEMO.horariosCanchas);
      window.localStorage.removeItem(CLAVES_DEMO.config);
      toast.success("Datos de demostración reiniciados");
      window.location.reload();
    } catch {
      toast.error("No se pudieron limpiar los datos de demostración");
    }
  };

  return (
    <>
      <h2 className={styles.titulo}>Configuración de demo</h2>

      <Alert variant="warning" title="Solo demostración">
        Estas opciones administran exclusivamente la configuración visual del entorno mock. No hay
        backend, cobros, seguridad ni lógica de concurrencia real detrás de ellas.
      </Alert>

      <DemoSettingsForm onCambio={refrescar} />

      <DemoScenarioSelector config={config} onCambio={refrescar} />

      <Card className={styles.card}>
        <h3 className={styles.titulo}>Reiniciar datos de la demo</h3>
        <p className={styles.texto}>
          Borra las canchas, horarios, reservas y configuración ficticios guardados en este
          navegador (las cuentas de prueba y la sesión no se modifican).
        </p>
        <div>
          <Button variant="danger" onClick={handleReiniciar}>
            <RotateCcw size={16} aria-hidden="true" />
            Reiniciar datos de demostración
          </Button>
        </div>
      </Card>
    </>
  );
}
