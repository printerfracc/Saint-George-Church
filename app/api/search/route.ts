import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SEARCH_CHILD_LIMIT,
  SEARCH_RESULT_LIMIT,
  isSearchableQuery,
  mediaTypeLabel,
  normalizeSearchQuery,
  searchChildUrl,
  searchHomeAnchorUrl,
  searchPageAnchorUrl,
  titleContains,
  type SearchResult,
} from "@/lib/search";
import { publicItemPath } from "@/lib/slug";

export const dynamic = "force-dynamic";

async function safeSearch(loader: () => Promise<SearchResult[]>) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function asParent(result: Omit<SearchResult, "children"> & { children?: SearchResult["children"] }): SearchResult {
  return {
    ...result,
    children: result.children ?? [],
  };
}

export async function GET(request: Request) {
  const q = normalizeSearchQuery(new URL(request.url).searchParams.get("q"));

  if (!isSearchableQuery(q)) {
    return NextResponse.json([]);
  }

  const titleMatch = titleContains(q);

  const [collections, sectors, news, priests, relics, activities, liturgies] =
    await Promise.all([
      safeSearch(async () => {
        const rows = await prisma.mediaCollection.findMany({
          where: {
            OR: [{ title: titleMatch }, { items: { some: { title: titleMatch } } }],
          },
          take: SEARCH_RESULT_LIMIT,
          include: {
            items: {
              where: { title: titleMatch },
              take: SEARCH_CHILD_LIMIT,
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            },
          },
        });

        return rows.map((collection) => {
          const url = publicItemPath("media", collection);
          const type = mediaTypeLabel(collection.category);

          return asParent({
            id: collection.id,
            title: collection.title,
            type,
            url,
            children: collection.items
              .filter((item) => item.title.trim())
              .map((item) => ({
                id: item.id,
                title: item.title,
                type,
                url: searchChildUrl(url, item.id),
              })),
          });
        });
      }),
      safeSearch(async () => {
        const rows = await prisma.service.findMany({
          where: {
            parentId: null,
            OR: [
              { title: titleMatch },
              { children: { some: { title: titleMatch } } },
            ],
          },
          take: SEARCH_RESULT_LIMIT,
          include: {
            children: {
              where: { title: titleMatch },
              take: SEARCH_CHILD_LIMIT,
              orderBy: [{ order: "asc" }, { createdAt: "asc" }],
              select: { id: true, title: true, slug: true },
            },
          },
        });

        return rows.map((sector) => {
          const url = publicItemPath("sectors", sector);

          return asParent({
            id: sector.id,
            title: sector.title,
            type: sector.parentId ? "خدمة" : "قطاع",
            url,
            children: sector.children.map((child) => ({
              id: child.id,
              title: child.title,
              type: "خدمة",
              url: searchChildUrl(url, child.id),
            })),
          });
        });
      }),
      safeSearch(async () => {
        const rows = await prisma.newsEvent.findMany({
          where: { isActive: true, title: titleMatch },
          take: SEARCH_RESULT_LIMIT,
          select: { id: true, title: true },
        });

        return rows.map((item) =>
          asParent({
            id: item.id,
            title: item.title,
            type: "خبر",
            url: searchHomeAnchorUrl(item.id),
          }),
        );
      }),
      safeSearch(async () => {
        const rows = await prisma.priest.findMany({
          where: { name: titleMatch },
          take: SEARCH_RESULT_LIMIT,
          select: { id: true, name: true },
        });

        return rows.map((item) =>
          asParent({
            id: item.id,
            title: item.name,
            type: "كاهن",
            url: searchHomeAnchorUrl(item.id),
          }),
        );
      }),
      safeSearch(async () => {
        const rows = await prisma.relic.findMany({
          where: { name: titleMatch },
          take: SEARCH_RESULT_LIMIT,
          select: { id: true, name: true },
        });

        return rows.map((item) =>
          asParent({
            id: item.id,
            title: item.name,
            type: "رفات",
            url: searchHomeAnchorUrl(item.id),
          }),
        );
      }),
      safeSearch(async () => {
        const rows = await prisma.churchActivity.findMany({
          where: { name: titleMatch },
          take: SEARCH_RESULT_LIMIT,
          select: { id: true, name: true, link: true },
        });

        return rows.map((item) =>
          asParent({
            id: item.id,
            title: item.name,
            type: "نشاط",
            url: searchHomeAnchorUrl(item.id),
          }),
        );
      }),
      safeSearch(async () => {
        const rows = await prisma.liturgyEntry.findMany({
          where: { title: titleMatch },
          take: SEARCH_RESULT_LIMIT,
          select: { id: true, title: true },
        });

        return rows.map((item) =>
          asParent({
            id: item.id,
            title: item.title,
            type: "طقس",
            url: searchPageAnchorUrl("/liturgies", item.id),
          }),
        );
      }),
    ]);

  const sortOrder: Record<string, number> = {
    كاهن: 1,
    رفات: 2,
    طقس: 3,
    عظة: 4,
    كتاب: 5,
    قطاع: 6,
    خدمة: 7,
  };

  const nestedChildIds = new Set<string>();
  for (const result of [
    ...collections,
    ...sectors,
    ...news,
    ...priests,
    ...relics,
    ...activities,
    ...liturgies,
  ]) {
    for (const child of result.children) {
      nestedChildIds.add(child.id);
    }
  }

  const seen = new Set<string>();
  const results = [
    ...collections,
    ...sectors,
    ...news,
    ...priests,
    ...relics,
    ...activities,
    ...liturgies,
  ]
    .filter((item) => !nestedChildIds.has(item.id))
    .filter((item) => {
      const key = `${item.url}|${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => (sortOrder[left.type] ?? 99) - (sortOrder[right.type] ?? 99));

  return NextResponse.json(results);
}
