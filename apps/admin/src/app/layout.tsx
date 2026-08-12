import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./design-system.css";
import { Providers } from "@/components/providers";

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
    default: "Administration | Terrasse Bleue",
    template: "%s | Administration Terrasse Bleue",
  },
  description: "Espace sécurisé de gestion du restaurant Terrasse Bleue à Essaouira.",
  applicationName: "Terrasse Bleue — Administration",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg?v=3", type: "image/svg+xml" }], shortcut: "/icon.svg?v=3", apple: "/terrasse-bleue-logo.png?v=3" },
  appleWebApp: {
    capable: true,
    title: "Administration Terrasse Bleue",
    statusBarStyle: "default",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning><Providers>{children}</Providers></body>
    </html>
  );
}
