import { CalendarCheck, CircleCheck, Goal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container/Container";
import styles from "./ComoFunciona.module.scss";

interface Paso {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

const PASOS: Paso[] = [
  {
    icono: Goal,
    titulo: "Elegí tu cancha",
    descripcion: "Explorá las canchas de fútbol 5, 7 y 11 disponibles y elegí la que más te guste.",
  },
  {
    icono: CalendarCheck,
    titulo: "Seleccioná fecha y horario",
    descripcion: "Mirá los turnos libres en tiempo real y reservá el horario que mejor te quede.",
  },
  {
    icono: CircleCheck,
    titulo: "Confirmá tu reserva",
    descripcion: "Listo. Recibís la confirmación al instante y tu partido queda organizado.",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="como-funciona-title">
      <Container>
        <div className={styles.header}>
          <h2 id="como-funciona-title" className={styles.title}>
            Cómo funciona
          </h2>
          <p className={styles.subtitle}>Reservar una cancha de fútbol toma menos de un minuto.</p>
        </div>

        <ol className={styles.steps}>
          {PASOS.map((paso, index) => {
            const Icono = paso.icono;
            return (
              <li key={paso.titulo} className={styles.step}>
                <div className={styles.stepTop}>
                  <span className={styles.stepIcon} aria-hidden="true">
                    <Icono size={24} />
                  </span>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                </div>
                <h3 className={styles.stepTitle}>{paso.titulo}</h3>
                <p className={styles.stepDescription}>{paso.descripcion}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
