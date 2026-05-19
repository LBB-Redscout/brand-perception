import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Perception Analyzer",
  description: "AI-powered brand intelligence reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
