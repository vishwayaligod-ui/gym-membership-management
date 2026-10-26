import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "./components/layout/AppLayout";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elite Fitness Studio | Dashboard",
  description: "Premium dashboard for managing members, attendance, renewals, and daily operations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Chrome autofill / password manager injects __gcrremoteframetoken / __gcruniqueid into the
  // DOM before React hydrates — suppressHydrationWarning silences that attribute-mismatch noise.
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <SessionProvider session={session}>
          <AppLayout>{children}</AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
