import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Asegúrate de que la ruta sea correcta
import AuthProvider from "@/contexts/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juego de Cartas Online",
  description: "Juega Brisca, Truco y más con tus amigos.",
};

// ACTUALIZACIÓN: Se usa la función generateViewport
export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-arp="">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}