import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers/Providers";

export const metadata: Metadata = {
  title: "ECGBC Admin Portal",
  description: "Administrative dashboard for the Ethiopian Council of Gospel Believers' Churches.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
