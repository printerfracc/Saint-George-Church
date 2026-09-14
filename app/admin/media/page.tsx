import { listLibraryCollections } from "@/actions/media";
import MediaCollectionManager from "@/components/admin/MediaCollectionManager";

export const metadata = {
  title: "إدارة الوسائط والمكتبة",
};

export default async function AdminMediaPage() {
  let collections: Awaited<ReturnType<typeof listLibraryCollections>> = [];

  try {
    collections = await listLibraryCollections();
  } catch {
    collections = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <MediaCollectionManager collections={collections} />
    </main>
  );
}
