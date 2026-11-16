"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui";
import type { InputProps } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import styles from "./PasswordInput.module.scss";

export type PasswordInputProps = Omit<InputProps, "type">;

/** Campo de contraseña con botón mostrar/ocultar accesible. */
export function PasswordInput({ className, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <Input
        {...rest}
        type={visible ? "text" : "password"}
        className={cn(styles.input, className)}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
