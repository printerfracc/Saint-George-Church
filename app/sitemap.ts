import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

const STATIC_ROUTES = [
  "/",
  "/liturgies",
  "/sectors",
  "/media",
  "/contact",
  "/history",
  "/priests",
  "/live",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  try {
    const [collections, sectors, publishedTawze3a, news] = await Promise.all([
      prisma.mediaCollection.findMany({
        select: { id: true, slug: true, createdAt: true },
        orderBy: { order: "asc" },
      }),
      prisma.service.findMany({
        select: { id: true, slug: true, createdAt: true },
        orderBy: { order: "asc" },
      }),
      prisma.tawze3a.findFirst({
        where: { isPublished: true },
        select: { id: true, createdAt: true },
      }),
      prisma.newsEvent.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const mediaEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
      url: `${baseUrl}/media/${collection.slug || collection.id}`,
      lastModified: collection.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const sectorEntries: MetadataRoute.Sitemap = sectors.map((sector) => ({
      url: `${baseUrl}/sectors/${sector.slug || sector.id}`,
      lastModified: sector.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const tawze3aEntries: MetadataRoute.Sitemap = publishedTawze3a
      ? [
          {
            url: `${baseUrl}/tawze3a`,
            lastModified: publishedTawze3a.createdAt,
            changeFrequency: "weekly",
            priority: 0.6,
          },
          {
            url: `${baseUrl}/tawze3a/gallery`,
            lastModified: publishedTawze3a.createdAt,
            changeFrequency: "weekly",
            priority: 0.6,
          },
        ]
      : [];

    const newsEntries: MetadataRoute.Sitemap = news.map((item) => ({
      url: `${baseUrl}/news/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...mediaEntries, ...sectorEntries, ...newsEntries, ...tawze3aEntries];
  } catch {
    return staticEntries;
  }
}
