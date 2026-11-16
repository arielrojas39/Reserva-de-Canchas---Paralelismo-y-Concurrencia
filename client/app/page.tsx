import { Beneficios } from "@/features/landing/Beneficios";
import { CanchasDestacadas } from "@/features/landing/CanchasDestacadas";
import { ComoFunciona } from "@/features/landing/ComoFunciona";
import { Hero } from "@/features/landing/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ComoFunciona />
      <CanchasDestacadas />
      <Beneficios />
    </>
  );
}
