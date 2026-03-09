import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { ClerkClientProvider } from "@/providers/clerk-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eldorya",
  description: "Real-time TTRPG platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Suspense>
          <ClerkClientProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ClerkClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
