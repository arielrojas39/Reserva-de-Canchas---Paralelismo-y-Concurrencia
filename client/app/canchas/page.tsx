import type { Metadata } from "next";
import { Container } from "@/components/layout/Container/Container";
import { CourtCatalog } from "@/features/canchas/CourtCatalog";
import { apiHabilitada } from "@/lib/api/config";
import { obtenerCanchas } from "@/lib/services/canchas.service";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Canchas",
  description:
    "Consultá las canchas de fútbol disponibles y elegí el horario de tu próximo partido.",
};

export default async function CanchasPage() {
  const canchas = await obtenerCanchas();

  return (
    <div className={styles.page}>
      <Container>
        <header className={styles.header}>
          <h1 className={styles.title}>Canchas disponibles</h1>
          <p className={styles.subtitle}>
            {apiHabilitada()
              ? "Elegí una cancha y una fecha para consultar la disponibilidad real de la API y reservar tu próximo partido."
              : "Elegí una cancha y una fecha para ver los horarios de tu próximo partido. Cada cancha tiene su propia grilla (por defecto, de 18:00 a 22:00)."}
          </p>
        </header>

        <CourtCatalog canchas={canchas} />
      </Container>
    </div>
  );
}
