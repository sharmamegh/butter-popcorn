import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Butter Popcorn — Movie Night Picker",
  description:
    "Can't decide what to watch? Pop the button and let fate pick your perfect movie night.",
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
