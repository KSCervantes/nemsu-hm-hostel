import type { Metadata } from "next";
import { Geist, Geist_Mono, Hurricane, Jim_Nightshade } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hurricane = Hurricane({
  variable: "--font-hurricane",
  weight: "400",
  subsets: ["latin"],
});

const jimNightshade = Jim_Nightshade({
  variable: "--font-jim-nightshade",
  weight: "400",
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
        className={`${geistSans.variable} ${geistMono.variable} ${hurricane.variable} ${jimNightshade.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
