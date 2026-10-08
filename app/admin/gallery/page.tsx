import GalleryManager from "@/components/admin/GalleryManager";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "إدارة الصور",
};

export default async function AdminGalleryPage() {
  let items: Awaited<ReturnType<typeof prisma.galleryMedia.findMany>> = [];

  try {
    items = await prisma.galleryMedia.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    items = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <GalleryManager
        items={items.flatMap((item) => {
          const createdAt = new Date(item.createdAt);
          if (Number.isNaN(createdAt.getTime()) || !item.url?.trim()) {
            return [];
          }

          return [
            {
              id: item.id,
              type: item.type,
              url: item.url,
              createdAt: createdAt.toISOString(),
            },
          ];
        })}
      />
    </main>
  );
}
