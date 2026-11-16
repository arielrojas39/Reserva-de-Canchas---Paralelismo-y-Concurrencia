import Image from "next/image";
import { Clock, MapPin, Trophy, Wallet } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { Container } from "@/components/layout/Container/Container";
import { obtenerCanchas } from "@/lib/services/canchas.service";
import { formatoPesos } from "@/lib/utils/formato";
import type { FormatoCancha, SuperficieCancha } from "@/types";
import styles from "./CanchasDestacadas.module.scss";

const FORMATO_LABELS: Record<FormatoCancha, string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11",
};

const SUPERFICIE_LABELS: Record<SuperficieCancha, string> = {
  sintetico: "Sintético",
  cesped: "Césped",
  parquet: "Parquet",
};

export async function CanchasDestacadas() {
  const canchas = await obtenerCanchas();

  return (
    <section id="canchas" className={styles.section} aria-labelledby="canchas-title">
      <Container>
        <div className={styles.header}>
          <div>
            <h2 id="canchas-title" className={styles.title}>
              Canchas destacadas
            </h2>
            <p className={styles.subtitle}>Elegí una cancha y mirá sus horarios disponibles.</p>
          </div>
        </div>

        <div className={styles.grid}>
          {canchas.map((cancha) => (
            <Card key={cancha.id} interactive className={styles.card}>
              <div className={styles.imageWrap}>
                {cancha.imagenUrl ? (
                  <Image
                    src={cancha.imagenUrl}
                    alt={`${cancha.nombre} — ${FORMATO_LABELS[cancha.formato]} en ${cancha.direccion}`}
                    width={800}
                    height={500}
                    unoptimized
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imageFallback} aria-hidden="true" />
                )}
                <Badge variant="primary" className={styles.formatBadge}>
                  {FORMATO_LABELS[cancha.formato]}
                </Badge>
              </div>

              <h3 className={styles.name}>{cancha.nombre}</h3>

              <ul className={styles.features}>
                <li>
                  <Trophy size={16} aria-hidden="true" />
                  {FORMATO_LABELS[cancha.formato]} · {SUPERFICIE_LABELS[cancha.superficie]}
                </li>
                <li>
                  <Clock size={16} aria-hidden="true" />
                  {cancha.iluminacion ? "Con iluminación" : "Sin iluminación"}
                </li>
                <li>
                  <MapPin size={16} aria-hidden="true" />
                  {cancha.direccion}
                </li>
                <li>
                  <Wallet size={16} aria-hidden="true" />
                  {formatoPesos(cancha.precioPorHora)} / hora
                </li>
              </ul>

              <Button href="/canchas" variant="outline" fullWidth>
                Ver disponibilidad
              </Button>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
