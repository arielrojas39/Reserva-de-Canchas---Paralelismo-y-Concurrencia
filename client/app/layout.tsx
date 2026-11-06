import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { SessionProvider } from "@/contexts/SessionContext";
import "@/styles/globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CanchasPlay — Reservas de canchas de fútbol",
    template: "%s | CanchasPlay",
  },
  description: "Encontrá y reservá canchas de fútbol 5, 7 y 11 de forma simple y rápida.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <SessionProvider>
          <a href="#contenido" className="skip-link">
            Saltar al contenido
          </a>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
        </SessionProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
