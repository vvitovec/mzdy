import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mzdová kalkulačka 2026",
  description: "Orientační výpočet hrubé a čisté mzdy pro HPP, DPP a DPČ.",
  metadataBase: new URL("https://mzdy.vvitovec.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
