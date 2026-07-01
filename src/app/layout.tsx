import type { Metadata } from "next";
import "./globals.css";
import LiveProvider from "@/components/LiveProvider";

export const metadata: Metadata = {
  title: "Mbuzis Daily — Live Social Video Rooms",
  description:
    "Mbuzis Daily is a live online social space. See who's online, request to join live video rooms, and jump into moderated conversations. Energetic, urban, community-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LiveProvider>{children}</LiveProvider>
      </body>
    </html>
  );
}
