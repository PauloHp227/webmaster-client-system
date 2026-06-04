import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webmaster Digital | Sistema de Clientes",
  description: "Sistema para clientes, projetos, contratos e briefings da Webmaster Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}