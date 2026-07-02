import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import LiveProvider from "@/components/LiveProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mbuzis Daily — Live Social Video Rooms",
  description:
    "Mbuzis Daily is a live online social space. See who's online, request to join live video rooms, and jump into moderated conversations. Energetic, urban, community-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="font-sans">
        <LiveProvider>{children}</LiveProvider>
      </body>
    </html>
  );
}
