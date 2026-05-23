import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eAvizat (sau nu?) — Cadastru, urbanism și autorizații în Cluj",
  description:
    "Platformă pentru antreprenori: parcele ANCPI, carte funciară, urbanism și roadmap autorizări după cod CAEN.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-body antialiased">{children}</body>
    </html>
  );
}
