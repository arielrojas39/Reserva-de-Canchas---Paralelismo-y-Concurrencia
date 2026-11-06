import { CalendarRange, Clock, ListChecks, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container/Container";
import styles from "./Beneficios.module.scss";

interface Beneficio {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
}

const BENEFICIOS: Beneficio[] = [
  {
    icono: Zap,
    titulo: "Reservas rápidas",
    descripcion: "Reservá en pocos pasos, sin llamadas ni trámites.",
  },
  {
    icono: Clock,
    titulo: "Consulta de horarios",
    descripcion: "Mirá los turnos libres de cada cancha al instante.",
  },
  {
    icono: ListChecks,
    titulo: "Gestión sencilla",
    descripcion: "Organizá tus reservas y consultá tus partidos en un solo lugar.",
  },
  {
    icono: CalendarRange,
    titulo: "Disponibilidad visual",
    descripcion: "Detectá el mejor horario de un vistazo, con el calendario al día.",
  },
];

export function Beneficios() {
  return (
    <section id="beneficios" className={styles.section} aria-labelledby="beneficios-title">
      <Container>
        <div className={styles.header}>
          <h2 id="beneficios-title" className={styles.title}>
            ¿Por qué CanchasPlay?
          </h2>
          <p className={styles.subtitle}>
            Todo lo que necesitás para organizar tu próximo partido.
          </p>
        </div>

        <ul className={styles.grid}>
          {BENEFICIOS.map((beneficio) => {
            const Icono = beneficio.icono;
            return (
              <li key={beneficio.titulo} className={styles.item}>
                <span className={styles.icon} aria-hidden="true">
                  <Icono size={22} />
                </span>
                <h3 className={styles.itemTitle}>{beneficio.titulo}</h3>
                <p className={styles.itemDescription}>{beneficio.descripcion}</p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
