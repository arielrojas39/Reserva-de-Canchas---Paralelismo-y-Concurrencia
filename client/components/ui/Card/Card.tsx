import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Efecto de elevación al pasar el mouse (para tarjetas accionables). */
  interactive?: boolean;
}

export function Card({ interactive = false, className, ...rest }: CardProps) {
  return (
    <div className={cn(styles.card, interactive && styles.interactive, className)} {...rest} />
  );
}
