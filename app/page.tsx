import HomeHero from "@/components/home/HomeHero";
import HomePageSections from "@/components/home/HomePageSections";
import { getAppUrl } from "@/lib/app-url";
import {
  CHURCH_ALTERNATE_NAMES,
  CHURCH_GEO,
  CHURCH_LOGO,
  CHURCH_NAME,
  CHURCH_OG_IMAGE,
  CHURCH_PHONE_NUMBERS,
  CHURCH_SEO_DESCRIPTION,
  YOUTUBE_CHANNEL_URL,
  toInternationalPhone,
} from "@/lib/church";
import { findDynamicContentByKey } from "@/lib/dynamic-content";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function Home() {
  let hero = null;
  let churchStory = null;
  let relics: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  }[] = [];
  let activities: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  }[] = [];
  let priests: {
    id: string;
    name: string;
    cloudinaryImageUrl: string | null;
    ordinationDate: string;
    confessionSchedule: string;
    bio: string | null;
    contactNumbers: string | null;
  }[] = [];
  let news: {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    createdAt: string;
  }[] = [];

  try {
    const [
      heroRecord,
      storyRecord,
      relicRecords,
      activityRecords,
      priestRecords,
      newsRecords,
    ] =
      await Promise.all([
        findDynamicContentByKey("hero"),
        findDynamicContentByKey("church_story"),
        prisma.relic.findMany({
          orderBy: { createdAt: "asc" },
        }),
        prisma.churchActivity.findMany({
          orderBy: { createdAt: "asc" },
        }),
        prisma.priest.findMany({
          orderBy: { ordinationDate: "asc" },
        }),
        prisma.newsEvent.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    hero = heroRecord
      ? {
          title: heroRecord.title,
          content: heroRecord.content,
          imageUrl: heroRecord.imageUrl,
        }
      : null;
    churchStory = storyRecord
      ? {
          title: storyRecord.title,
          content: storyRecord.content,
          imageUrl: storyRecord.imageUrl,
        }
      : null;

    relics = relicRecords.map((relic) => ({
      id: relic.id,
      name: relic.name,
      description: relic.description,
      imageUrl: relic.imageUrl,
    }));

    activities = activityRecords.map((activity) => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      imageUrl: activity.imageUrl,
    }));

    priests = priestRecords.map((priest) => ({
      id: priest.id,
      name: priest.name,
      cloudinaryImageUrl: priest.cloudinaryImageUrl,
      ordinationDate: priest.ordinationDate.toISOString(),
      confessionSchedule: priest.confessionSchedule,
      bio: priest.bio,
      contactNumbers: priest.contactNumbers,
    }));

    news = newsRecords.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt.toISOString(),
    }));
  } catch {
    hero = null;
    churchStory = null;
    relics = [];
    activities = [];
    priests = [];
    news = [];
  }

  const siteUrl = getAppUrl();
  const schemaObject = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Church"],
    name: CHURCH_NAME,
    alternateName: CHURCH_ALTERNATE_NAMES,
    description: CHURCH_SEO_DESCRIPTION,
    url: siteUrl,
    image: `${siteUrl}${CHURCH_OG_IMAGE}`,
    logo: `${siteUrl}${CHURCH_LOGO}`,
    telephone: CHURCH_PHONE_NUMBERS.map(toInternationalPhone),
    address: {
      "@type": "PostalAddress",
      streetAddress: CHURCH_NAME,
      addressLocality: CHURCH_GEO.addressLocality,
      addressRegion: CHURCH_GEO.addressRegion,
      addressCountry: CHURCH_GEO.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: CHURCH_GEO.latitude,
      longitude: CHURCH_GEO.longitude,
    },
    hasMap: `https://www.google.com/maps?q=${CHURCH_GEO.latitude},${CHURCH_GEO.longitude}`,
    sameAs: [YOUTUBE_CHANNEL_URL],
  };

  return (
    <main className="flex flex-1 flex-col bg-cream">
      <script
        id="church-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaObject).replace(/</g, "\\u003c"),
        }}
      />
      <HomeHero
        imageUrl={hero?.imageUrl}
        title={hero?.title}
        subtitle={hero?.content}
      />
      <HomePageSections
        news={news}
        churchStory={churchStory}
        relics={relics}
        activities={activities}
        priests={priests}
      />
    </main>
  );
}
