import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón. */
  variant?: ButtonVariant;
  /** Tamaño del botón. */
  size?: ButtonSize;
  /** Muestra un indicador de carga y desactiva el botón. */
  isLoading?: boolean;
  /** Ocupa todo el ancho disponible. */
  fullWidth?: boolean;
  /**
   * Si se indica, renderiza un enlace con apariencia de botón
   * (navegación en lugar de acción).
   */
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  href,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );

  if (href) {
    // Los handlers de eventos son compatibles en runtime entre <button> y <a>;
    // se estrecha el tipo porque TS no permite el spread directo entre ambos.
    const linkProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
