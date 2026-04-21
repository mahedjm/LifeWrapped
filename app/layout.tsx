import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Écho - Dashboard",
  description: "Suivez votre temps d'écoute musical personnel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={sora.variable} suppressHydrationWarning>
      <body style={{ fontFamily: 'var(--font-sora), sans-serif' }}>{children}</body>
    </html>
  );
}
