import { notFound } from "next/navigation";
import { getLibraryCollection } from "@/actions/media";
import MediaItemManager from "@/components/admin/MediaItemManager";

export const metadata = {
  title: "ملفات القسم",
};

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
