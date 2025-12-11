import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rune-X OCR",
  description:
    "Upload Chinese handwriting or print to extract text, meanings, and translations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#e5f0ff,transparent_45%),radial-gradient(circle_at_80%_0%,#f3f6ff,transparent_35%)]" />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
