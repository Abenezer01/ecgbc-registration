import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/auth-guard";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ECGBC Church Portal",
  description: "Official registration and management portal for ECGBC churches and fellowships.",
  icons: {
    icon: "https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-neutral-50 text-neutral-900`}>
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
