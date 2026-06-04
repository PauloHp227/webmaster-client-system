import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webmaster Digital",
  description: "Sistema de Gestão Webmaster Digital",
  icons: {
    icon: "/favicon.png",
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