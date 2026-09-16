import { listMediaCollections } from "@/lib/media-db";
import { listServiceRecords } from "@/lib/service-db";

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
    const [sectors, collections] = await Promise.all([
      listServiceRecords(),
      listMediaCollections(),
    ]);

    return {
      sectorItems: toNavItems(sectors, (id) => `/sectors#sector-${id}`),
      mediaItems: toNavItems(collections, (id) => `/media/${id}`),
    };
  } catch {
    return { sectorItems: [], mediaItems: [] };
  }
}
