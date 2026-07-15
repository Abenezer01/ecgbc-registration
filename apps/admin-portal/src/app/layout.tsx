import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers/Providers";

export const metadata: Metadata = {
  title: "ECGBC Enterprise Portal",
  description: "Next-generation admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
