import { listMediaCollections } from "@/lib/media-db";
import { listServiceRecords } from "@/lib/service-db";
import { prisma } from "@/lib/prisma";

export type NavSubItem = {
  title: string;
  href: string;
  isOverview?: boolean;
};

function toNavItems(
  entries: Array<{ id: string; title: string; slug?: string | null }>,
  hrefFor: (entry: { id: string; slug?: string | null }) => string,
) {
  return entries.flatMap((entry) => {
    const title = entry.title.trim();
    if (!title) {
      return [];
    }

    return [{ title, href: hrefFor(entry) }];
  });
}

export async function getNavEntries() {
  try {
    const [sectors, collections, publishedTawze3a] = await Promise.all([
      listServiceRecords(),
      listMediaCollections(),
      prisma.tawze3a.findFirst({
        where: { isPublished: true },
        select: { id: true },
      }),
    ]);

    return {
      sectorItems: toNavItems(sectors, (item) => `/sectors/${item.slug || item.id}`),
      mediaItems: toNavItems(collections, (item) => `/media/${item.slug || item.id}`),
      showTawze3a: Boolean(publishedTawze3a),
    };
  } catch {
    return { sectorItems: [], mediaItems: [], showTawze3a: false };
  }
}
