import type { Metadata } from "next";
import { SessionGate } from "@/features/auth/SessionGate";
import { ReservationList } from "@/features/reservas/ReservationList";

export const metadata: Metadata = {
  title: "Mis reservas",
};

export default function MisReservasPage() {
  return (
    <SessionGate heading="Mis reservas">
      <ReservationList />
    </SessionGate>
  );
}
