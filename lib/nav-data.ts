import { listMediaCollections } from "@/lib/media-db";
import { listServiceRecords } from "@/lib/service-db";
import { prisma } from "@/lib/prisma";

export type NavSubItem = {
  title: string;
  href: string;
  isOverview?: boolean;
};

function toNavItems(
  entries: Array<{ id: string; title: string }>,
  hrefFor: (id: string) => string,
) {
  return entries.flatMap((entry) => {
    const title = entry.title.trim();
    if (!title) {
      return [];
    }

    return [{ title, href: hrefFor(entry.id) }];
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
      sectorItems: toNavItems(sectors, (id) => `/sectors/${id}`),
      mediaItems: toNavItems(collections, (id) => `/media/${id}`),
      showTawze3a: Boolean(publishedTawze3a),
    };
  } catch {
    return { sectorItems: [], mediaItems: [], showTawze3a: false };
  }
}
