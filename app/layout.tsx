import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Problem Signal Miner",
  description: "Extract actionable pain points from HackerNews discussions",
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
