import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./Container.module.scss";

/** Contenedor centrado con ancho máximo y padding responsive. */
export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.container, className)} {...rest} />;
}
