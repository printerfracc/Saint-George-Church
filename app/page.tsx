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
import { priestDateValue } from "@/lib/admin-labels";
import { findDynamicContentByKey } from "@/lib/dynamic-content";
import { prisma } from "@/lib/prisma";
import { checkLiveStreamStatus } from "@/lib/youtube";
import { ensurePriestColumns } from "@/actions/priests";

export const revalidate = 60;

async function loadOr<T>(loader: () => Promise<T>, fallback: T) {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const [heroRecord, storyRecord, relicRecords, activityRecords, priestRecords, newsRecords, liveStatus] =
    await Promise.all([
      loadOr(() => findDynamicContentByKey("hero"), null),
      loadOr(() => findDynamicContentByKey("church_story"), null),
      loadOr(
        () =>
          prisma.relic.findMany({
            orderBy: { order: "asc" },
          }),
        [],
      ),
      loadOr(
        () =>
          prisma.churchActivity.findMany({
            orderBy: { order: "asc" },
          }),
        [],
      ),
      loadOr(async () => {
        await ensurePriestColumns();
        return prisma.priest.findMany({
          orderBy: { order: "asc" },
        });
      }, []),
      loadOr(
        async () => {
          try {
            return await prisma.newsEvent.findMany({
              where: { isActive: true },
              orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            });
          } catch {
            return prisma.newsEvent.findMany({
              where: { isActive: true },
              orderBy: { createdAt: "desc" },
            });
          }
        },
        [],
      ),
      loadOr(checkLiveStreamStatus, { isLive: false }),
    ]);

  const hero = heroRecord
    ? {
        title: heroRecord.title,
        content: heroRecord.content,
        imageUrl: heroRecord.imageUrl,
      }
    : null;
  const churchStory = storyRecord
    ? {
        title: storyRecord.title,
        content: storyRecord.content,
        imageUrl: storyRecord.imageUrl,
      }
    : null;

  const relics = relicRecords.map((relic) => ({
    id: relic.id,
    name: relic.name,
    description: relic.description,
    imageUrl: relic.imageUrl,
  }));

  const activities = activityRecords.map((activity) => ({
    id: activity.id,
    name: activity.name,
    description: activity.description,
    imageUrl: activity.imageUrl,
    link: activity.link,
  }));

  const priests = priestRecords.map((priest) => ({
    id: priest.id,
    name: priest.name,
    cloudinaryImageUrl: priest.cloudinaryImageUrl,
    ordinationDate: priestDateValue(priest.ordinationDateText, priest.ordinationDate) ?? "",
    confessionSchedule: priest.confessionSchedule,
    bio: priest.bio,
    qommosiyaDegree: priest.qommosiyaDegree,
    deathDate: priestDateValue(priest.deathDateText, priest.deathDate),
    contactNumbers: priest.contactNumbers,
  }));

  const news = newsRecords.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    createdAt: item.createdAt.toISOString(),
  }));

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
        isLive={"isLive" in liveStatus && liveStatus.isLive}
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
