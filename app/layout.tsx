import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hostel Kitchen - NEMSU Lianga Campus",
  description: "Fresh & Delicious Filipino Cuisine at NEMSU - Lianga Campus. Order authentic home-cooked meals, snacks, desserts and refreshing drinks.",
  icons: {
    icon: "/img/BSHM LOGO.jpg",
    shortcut: "/img/BSHM LOGO.jpg",
    apple: "/img/BSHM LOGO.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${outfit.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
