import type { ReactNode } from "react";
import { Search } from "lucide-react";
import styles from "./EmptyState.module.scss";

export interface EmptyStateProps {
  /** Icono decorativo (por defecto, una lupa). */
  icon?: ReactNode;
  /** Título del estado vacío. */
  title: string;
  /** Descripción opcional. */
  description?: string;
  /** Acción principal opcional (ej.: un Button). */
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState} role="status">
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <Search size={32} />}
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
