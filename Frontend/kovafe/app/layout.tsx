import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalieso",
  description: "Social NFT marketplace on Injective",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
