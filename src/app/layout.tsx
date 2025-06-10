import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/contexts/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juego de Cartas Online",
  description: "Juega Brisca, Truco y más con tus amigos.",
  // Propiedad clave para el diseño responsivo.
  // Asegura que la página use el ancho del dispositivo y no se aplique un zoom inicial.
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <AuthProvider>
          <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] -z-10"></div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}