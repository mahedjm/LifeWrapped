import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

import Script from "next/script";

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
      <body style={{ fontFamily: 'var(--font-sora), sans-serif' }}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var color = localStorage.getItem('lw-theme-color');
                  if (color) {
                    document.documentElement.style.setProperty('--accent-green', color);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
