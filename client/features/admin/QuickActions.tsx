import { ClipboardList, Goal, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui";
import styles from "./QuickActions.module.scss";

interface Accion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

const ACCIONES: Accion[] = [
  { href: "/canchas", etiqueta: "Ver catálogo de canchas", icono: Goal },
  { href: "/admin/reservas", etiqueta: "Gestionar reservas", icono: ClipboardList },
  { href: "/", etiqueta: "Ir al sitio público", icono: Sparkles },
];

/** Accesos rápidos a las secciones principales. */
export function QuickActions() {
  return (
    <div className={styles.grid}>
      {ACCIONES.map((accion) => (
        <Button key={accion.href} href={accion.href} variant="outline" className={styles.accion}>
          <accion.icono size={16} aria-hidden="true" />
          {accion.etiqueta}
        </Button>
      ))}
    </div>
  );
}
