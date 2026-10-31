import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Butter Popcorn | Group Movie Picker",
  description:
    "Stop arguing over what to watch. Butter Popcorn finds a movie everyone can live with.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
