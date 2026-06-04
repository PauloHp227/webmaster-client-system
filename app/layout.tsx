import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webmaster Digital | Sistema de Clientes",
  description:
    "Sistema para clientes, projetos, contratos e briefings da Webmaster Digital",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  openGraph: {
    title: "Webmaster Digital | Sistema de Clientes",
    description:
      "Sistema para clientes, projetos, contratos e briefings da Webmaster Digital",
    url: "https://webmaster-client-system.vercel.app",
    siteName: "Webmaster Digital",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Webmaster Digital",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Webmaster Digital | Sistema de Clientes",
    description:
      "Sistema para clientes, projetos, contratos e briefings da Webmaster Digital",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}