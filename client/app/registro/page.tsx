import type { Metadata } from "next";
import { RegistroForm } from "@/features/auth/RegistroForm";

export const metadata: Metadata = {
  title: "Registrarse",
};

export default function RegistroPage() {
  return <RegistroForm />;
}
