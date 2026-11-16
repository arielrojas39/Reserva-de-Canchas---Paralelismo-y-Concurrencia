"use client";

import { usuariosMock } from "@/lib/mocks/usuarios.mock";
import { PASSWORD_DEMO } from "@/lib/mocks/auth.mock";
import styles from "./DemoAccountsHint.module.scss";

export interface DemoAccountsHintProps {
  /** Completa el formulario con el email elegido. */
  onSelect: (email: string) => void;
}

/** Caja de credenciales ficticias para probar la sesión demo. */
export function DemoAccountsHint({ onSelect }: DemoAccountsHintProps) {
  return (
    <aside className={styles.box} aria-label="Cuentas de prueba">
      <p className={styles.title}>Cuentas de prueba (solo demo)</p>
      <ul className={styles.list}>
        {usuariosMock.map((usuario) => (
          <li key={usuario.id}>
            <button
              type="button"
              className={styles.account}
              onClick={() => onSelect(usuario.email)}
            >
              <span className={styles.accountName}>{usuario.nombre}</span>
              <span className={styles.accountRole}>
                {usuario.rol === "admin" ? "admin" : "cliente"}
              </span>
              <code className={styles.accountEmail}>{usuario.email}</code>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.password}>
        Contraseña demo compartida: <code>{PASSWORD_DEMO}</code>
      </p>
    </aside>
  );
}
