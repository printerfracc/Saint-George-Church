import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cairo } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import OpeningExperience from "@/components/opening/OpeningExperience";
import { getAppUrl } from "@/lib/app-url";
import { getNavEntries } from "@/lib/nav-data";
import { checkLiveStreamStatus } from "@/lib/youtube";
import {
  CHURCH_LOGO,
  CHURCH_NAME,
  CHURCH_OG_IMAGE,
  CHURCH_SEO_DESCRIPTION,
  CHURCH_SEO_KEYWORDS,
  CHURCH_SHORT_NAME,
  CHURCH_SITE_URL,
} from "@/lib/church";
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
    icon: CHURCH_LOGO,
    apple: CHURCH_LOGO,
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
        url: `${CHURCH_SITE_URL}${CHURCH_OG_IMAGE}`,
        width: 1200,
        height: 1200,
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
        url: `${CHURCH_SITE_URL}${CHURCH_OG_IMAGE}`,
        width: 1200,
        height: 1200,
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
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isOpeningRoute = pathname.startsWith("/opening");
  const hideChrome = isAdminRoute || isOpeningRoute;
  const [navEntries, isLive] = hideChrome
    ? [{ sectorItems: [], mediaItems: [], showTawze3a: false }, false]
    : await Promise.all([
        getNavEntries(),
        checkLiveStreamStatus()
          .then((status) => {
            if (status.ok === false) {
              console.error(status.error, status.details ?? status);
              return false;
            }

            return status.isLive;
          })
          .catch((error) => {
            console.error("YouTube live banner check failed", error);
            return false;
          }),
      ]);

  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col text-deep-red font-sans ${
          isOpeningRoute ? "bg-white" : "bg-cream"
        }`}
      >
        {hideChrome ? null : (
          <div className="fixed top-0 z-50 w-full overflow-visible">
            <Navbar
              sectorItems={navEntries.sectorItems}
              mediaItems={navEntries.mediaItems}
              showTawze3a={navEntries.showTawze3a}
              isLive={isLive}
            />
          </div>
        )}
        <OpeningExperience>{children}</OpeningExperience>
        {hideChrome ? null : <Footer />}
      </body>
    </html>
  );
}
