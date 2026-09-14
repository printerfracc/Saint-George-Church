import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cairo } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getAppUrl } from "@/lib/app-url";
import {
  CHURCH_LOGO,
  CHURCH_NAME,
  CHURCH_OG_IMAGE,
  CHURCH_SEO_DESCRIPTION,
  CHURCH_SEO_KEYWORDS,
  CHURCH_SHORT_NAME,
} from "@/lib/church";
import { getYouTubeLiveStatus, type YouTubeLiveStatus } from "@/lib/youtube";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    template: "%s | كنيسة مارجرجس المطرية",
    default: "كنيسة الشهيد العظيم مارجرجس بالمطرية",
  },
  description: CHURCH_SEO_DESCRIPTION,
  keywords: CHURCH_SEO_KEYWORDS,
  icons: {
    icon: [{ url: CHURCH_LOGO, type: "image/png" }],
    apple: CHURCH_LOGO,
    shortcut: CHURCH_LOGO,
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    url: "/",
    siteName: CHURCH_SHORT_NAME,
    title: {
      template: "%s | كنيسة مارجرجس المطرية",
      default: "كنيسة الشهيد العظيم مارجرجس بالمطرية",
    },
    description: CHURCH_SEO_DESCRIPTION,
    images: [
      {
        url: CHURCH_OG_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: CHURCH_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: CHURCH_NAME,
    description: CHURCH_SEO_DESCRIPTION,
    images: [
      {
        url: CHURCH_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: CHURCH_NAME,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let live: YouTubeLiveStatus = { isLive: false, videoId: null, title: null };

  try {
    live = await getYouTubeLiveStatus();
  } catch {
    live = { isLive: false, videoId: null, title: null };
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-deep-red font-sans">
        {isAdminRoute ? null : <Navbar isLive={live.isLive} />}
        {children}
        {isAdminRoute ? null : <Footer />}
      </body>
    </html>
  );
}
