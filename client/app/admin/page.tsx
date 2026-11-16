import type { Metadata } from "next";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}

export const instant = false;
