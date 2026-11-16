"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, User } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { AdminSidebar } from "@/features/admin/AdminSidebar";
import { useSession } from "@/contexts/SessionContext";
import styles from "./AdminLayout.module.scss";

export interface AdminLayoutProps {
  children: React.ReactNode;
}

/** Shell del panel administrativo. La autorización real la aplica la API. */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { usuario, estado } = useSession();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuAbierto(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuAbierto]);

  if (!usuario) {
    return (
      <div className={styles.gate}>
        <EmptyState
          icon={<User size={32} />}
          title="Iniciá sesión para continuar"
          description="Iniciá sesión con una cuenta de administrador."
          action={
            <Button href="/login" size="lg">
              Iniciar sesión
            </Button>
          }
        />
      </div>
    );
  }

  if (estado !== "admin") {
    return (
      <div className={styles.gate}>
        <EmptyState
          icon={<ShieldCheck size={32} />}
          title="Sección solo para administradores"
          description="Tu cuenta no tiene permisos de administración."
          action={
            <Button href="/" variant="outline" size="lg">
              Volver al inicio
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar
        abierto={menuAbierto}
        pathname={pathname}
        onNavigate={() => setMenuAbierto(false)}
      />

      {menuAbierto && (
        <div className={styles.backdrop} aria-hidden="true" onClick={() => setMenuAbierto(false)} />
      )}

      <div className={styles.columna}>
        <div className={styles.contenido}>
          <div className={styles.menuMovil}>
            <Button
              variant="outline"
              aria-controls="admin-sidebar"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((valor) => !valor)}
            >
              <Menu size={18} aria-hidden="true" />
              Secciones de administración
            </Button>
          </div>
          <h1 className={styles.titulo}>Administración</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
