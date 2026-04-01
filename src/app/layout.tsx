import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { AdSenseHeadScript } from "@/components/ads/adsense-head-script";
import { AppHeader } from "@/components/app-header";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
  },
  icons: {
    icon: "/globe.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 text-zinc-900">
        <div className="mx-auto min-h-screen w-full max-w-xl bg-zinc-50">
          <AppHeader />
          {children}
          <footer className="border-t border-zinc-200 px-4 py-4">
            <nav className="flex flex-wrap gap-3 text-xs text-zinc-500">
              <Link href="/about" className="underline-offset-2 hover:text-zinc-700 hover:underline">
                助けっ人掲示板とは
              </Link>
              <Link href="/guidelines" className="underline-offset-2 hover:text-zinc-700 hover:underline">
                使い方と流れ
              </Link>
              <Link href="/privacy" className="underline-offset-2 hover:text-zinc-700 hover:underline">
                プライバシー
              </Link>
              <Link href="/terms" className="underline-offset-2 hover:text-zinc-700 hover:underline">
                利用規約
              </Link>
              <Link href="/ads-info" className="underline-offset-2 hover:text-zinc-700 hover:underline">
                広告と運営方針
              </Link>
            </nav>
          </footer>
        </div>
        <AdSenseHeadScript />
      </body>
    </html>
  );
}
