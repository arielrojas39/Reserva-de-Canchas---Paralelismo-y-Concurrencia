import { AdminLayout } from "@/features/admin/AdminLayout";

/**
 * La navegación a /admin depende de la sesión simulada del cliente
 * (localStorage), por lo que legítimamente no es "instantánea":
 * se opta out de la validación de instant navigation (doc oficial).
 */
export const instant = false;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <AdminLayout>{children}</AdminLayout>;
}
