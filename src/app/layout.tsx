import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Butter Popcorn — Group Movie Picker",
  description:
    "Rank movies with your friends on separate devices. Butter Popcorn finds the group's most compatible pick.",
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
