import type React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ConditionalNavigationBar } from "@/components/conditionalNavbar";
import { Toaster } from "sonner";
import {Metadata} from "next";
import Footer1 from "@/components/footer"; // Import Sonner

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
    metadataBase: new URL('https://chat.vercel.ai'),
    title: 'Salamon',
    description: 'Build Better Decks with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          inter.className,
          " bg-black text-slate-50",
        )}
      >
      <ConditionalNavigationBar />
        {children}
        <Toaster position="top-right" richColors theme="dark" />
      <Footer1/>
      </body>
    </html>
  );
}
