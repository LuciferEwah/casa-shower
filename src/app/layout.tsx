import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Casa Shower Luci",
  description: "Casa Shower Gift Registry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark bg-[#0b0514]`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0b0514] text-slate-200">{children}</body>
    </html>
  );
}
