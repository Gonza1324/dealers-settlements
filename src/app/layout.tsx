import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dealers Settlements",
  description: "Internal web app for dealers, imports, expenses and settlements.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
