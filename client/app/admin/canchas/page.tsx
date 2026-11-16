import type { Metadata } from "next";
import { CanchasSection } from "@/features/admin/CanchasSection";

export const metadata: Metadata = {
  title: "Canchas y horarios",
  robots: { index: false },
};

export default function AdminCanchasPage() {
  return <CanchasSection />;
}

export const instant = false;
