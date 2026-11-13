import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AetherLoad · Control de carga de gas",
  applicationName: "AetherLoad",
  icons: { icon: "/brand/aetherload-logo.png", apple: "/brand/aetherload-logo.png" },
  description: "Sistema integral de administración, monitoreo en tiempo real y conciliación de órdenes de carga de gas líquido",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-foreground font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
