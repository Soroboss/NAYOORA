import type { Metadata } from "next";
import "./globals.css";
import "./overrides.css";

import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "NAYOORA",
  description: "NAYOORA — Gérez. Connectez. Développez.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
