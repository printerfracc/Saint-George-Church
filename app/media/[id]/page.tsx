import Link from "next/link";
import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import MediaGallery from "@/components/public/MediaGallery";
import { getLibraryCollection } from "@/actions/media";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getLibraryCollection(id).catch(() => null);

  return {
    title: collection?.title ?? "الوسائط والمكتبة",
  };
}

export default async function MediaCollectionPage({
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <p className="text-center">
        <Link href="/media" className="text-sm font-bold text-coptic-gold-dark">
          الوسائط والمكتبة
        </Link>
      </p>
      <h1 className="mt-3 bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        {collection.title}
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      {collection.description ? (
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
          {collection.description}
        </p>
      ) : null}

      {collection.items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70">
          لا توجد ملفات في هذا القسم بعد.
        </p>
      ) : (
        <MediaGallery items={collection.items} />
      )}
    </main>
  );
}
