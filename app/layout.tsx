import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import { SkillfitAuthProvider } from "@/components/skillfit/AuthProvider";

import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI SkillFit — Video Assessment for Workforce Fitment",
  description: "AI-powered, mobile-first video assessment platform for screening blue-collar and polytechnic candidates across Karnataka in Kannada, Hindi, and English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#181f2a" />
      </head>
      <body className={`${monaSans.className} antialiased pattern`}>
        <SkillfitAuthProvider>{children}</SkillfitAuthProvider>

        <Toaster />
      </body>
    </html>
  );
}
