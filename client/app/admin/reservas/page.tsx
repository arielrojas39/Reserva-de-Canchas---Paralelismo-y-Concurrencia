import type { Metadata } from "next";
import { ReservasSection } from "@/features/admin/ReservasSection";
import styles from "./reservas.module.scss";

export const metadata: Metadata = {
  title: "Reservas",
  robots: { index: false },
};

export default function AdminReservasPage() {
  return (
    <>
      <h2 className={styles.titulo}>Reservas</h2>
      <ReservasSection />
    </>
  );
}

export const instant = false;
