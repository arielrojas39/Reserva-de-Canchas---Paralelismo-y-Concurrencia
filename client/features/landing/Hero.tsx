import Image from "next/image";
import { ArrowRight, CalendarDays, CircleCheck } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { Container } from "@/components/layout/Container/Container";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Container>
        <div className={styles.grid}>
          <div className={styles.content}>
            <Badge variant="primary">Reservas online de fútbol</Badge>
            <h1 id="hero-title" className={styles.title}>
              Reservá tu cancha en segundos
            </h1>
            <p className={styles.subtitle}>
              Encontrá el horario ideal, elegí tu cancha y organizá tu próximo partido de forma
              rápida y sencilla.
            </p>
            <div className={styles.actions}>
              <Button href="/#canchas" size="lg">
                Ver canchas
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button href="/#como-funciona" variant="outline" size="lg">
                Cómo funciona
              </Button>
            </div>
          </div>

          <div className={styles.visual}>
            <Image
              src="/images/hero-pitch.svg"
              alt="Cancha de fútbol vista desde arriba con el círculo central y la pelota"
              width={1200}
              height={900}
              priority
              unoptimized
              className={styles.image}
            />
            <div className={styles.floatChip}>
              <span className={styles.floatIcon} aria-hidden="true">
                <CircleCheck size={20} />
              </span>
              <span className={styles.floatText}>
                <strong>Reserva confirmada</strong>
                Hoy 20:00 · Fútbol 5 Los Álamos
              </span>
            </div>
            <div className={styles.floatBadge}>
              <CalendarDays size={16} aria-hidden="true" />
              Turnos las 24 horas
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
