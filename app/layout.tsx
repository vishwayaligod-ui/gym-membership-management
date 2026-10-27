import type { Metadata, Viewport } from "next";
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
  applicationName: "FF",
  icons: {
    icon: [
      { url: "/ff-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/ff-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="h-full">
        <SessionProvider session={session}>
          <AppLayout>{children}</AppLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
