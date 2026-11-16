import styles from "./BrandMark.module.scss";

export type BrandMarkSize = "md" | "lg";

export interface BrandMarkProps {
  /** Tamaño de la marca. */
  size?: BrandMarkSize;
  className?: string;
}

/**
 * Icono + nombre de la plataforma. Va dentro del <Link> de navegación,
 * que aporta el href y el aria-label.
 */
export function BrandMark({ size = "md", className }: BrandMarkProps) {
  return (
    <span className={`${styles.mark} ${styles[size]} ${className ?? ""}`.trim()}>
      <span className={styles.logo} aria-hidden="true">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </span>
      <span className={styles.name}>
        Canchas<span className={styles.nameAccent}>Play</span>
      </span>
    </span>
  );
}
