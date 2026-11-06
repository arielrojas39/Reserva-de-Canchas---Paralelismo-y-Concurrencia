import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./Alert.module.scss";

export type AlertVariant = "success" | "error" | "warning" | "info";

const VARIANT_ICONS: Record<AlertVariant, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante semántica del mensaje. */
  variant?: AlertVariant;
  /** Título opcional del mensaje. */
  title?: string;
  /** Icono propio (reemplaza el de la variante). */
  icon?: ReactNode;
}

export function Alert({ variant = "info", title, icon, className, children, ...rest }: AlertProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(styles.alert, styles[variant], className)}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <Icon size={20} />}
      </span>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.description}>{children}</div>}
      </div>
    </div>
  );
}
