import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibraryCollection } from "@/actions/media";
import MediaItemManager from "@/components/admin/MediaItemManager";
import { recordPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await getLibraryCollection(id).catch(() => null);

  return recordPageMetadata({
    title: collection?.title,
    description: collection?.description,
    imageUrl: collection?.imageUrl,
    fallbackTitle: "ملفات القسم",
    path: `/admin/media/${id}`,
  });
}

export const maxDuration = 60;

export default async function AdminMediaItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getLibraryCollection(id).catch(() => null);

  if (!collection) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <MediaItemManager
        collectionId={collection.id}
        collectionTitle={collection.title}
        items={collection.items}
      />
    </main>
  );
}
