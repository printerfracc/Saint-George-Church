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
  "/prayers",
  "/live",
  "/sermons",
  "/prayer-requests",
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
    const [collections, sectors] = await Promise.all([
      prisma.mediaCollection.findMany({
        select: { id: true, createdAt: true },
        orderBy: { order: "asc" },
      }),
      prisma.service.findMany({
        select: { id: true, createdAt: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const mediaEntries: MetadataRoute.Sitemap = collections.map((collection) => ({
      url: `${baseUrl}/media/${collection.id}`,
      lastModified: collection.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const sectorEntries: MetadataRoute.Sitemap = sectors.map((sector) => ({
      url: `${baseUrl}/sectors/${sector.id}`,
      lastModified: sector.createdAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...mediaEntries, ...sectorEntries];
  } catch {
    return staticEntries;
  }
}
