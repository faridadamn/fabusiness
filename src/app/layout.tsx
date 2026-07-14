import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FA Business OS",
  description: "Personal Business Operating System for focused execution and revenue decisions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
