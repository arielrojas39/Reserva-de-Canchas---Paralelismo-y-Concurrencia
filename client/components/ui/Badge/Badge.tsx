import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Badge.module.scss";

export type BadgeVariant = "primary" | "success" | "warning" | "error" | "info" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Variante semántica del distintivo. */
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...rest }: BadgeProps) {
  return <span className={cn(styles.badge, styles[variant], className)} {...rest} />;
}
