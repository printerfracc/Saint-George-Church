export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import HashScroll from "@/components/HashScroll";
import LocalSearchInput from "@/components/LocalSearchInput";
import MediaGallery from "@/components/public/MediaGallery";
import ReadMoreText from "@/components/public/ReadMoreText";
import { getLibraryCollection } from "@/actions/media";
import { normalizeSearchQuery } from "@/lib/search";
import { recordPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getLibraryCollection(slug).catch(() => null);

  return recordPageMetadata({
    title: collection?.title,
    description: collection?.description,
    imageUrl: collection?.imageUrl,
    fallbackTitle: "الوسائط والمكتبة",
  });
}

export default async function MediaCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ slug }, { q }] = await Promise.all([params, searchParams]);
  const collection = await getLibraryCollection(slug).catch(() => null);

  if (!collection) {
    notFound();
  }

  const query = normalizeSearchQuery(q);
  const items = query
    ? collection.items.filter((item) => item.title.includes(query))
    : collection.items;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16">
      <HashScroll />
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
        <div className="mx-auto mt-6 max-w-2xl text-center">
          <ReadMoreText
            text={collection.description}
            lines={5}
            className="whitespace-pre-line text-sm leading-8 text-deep-red/80 md:text-base"
            buttonClassName="text-coptic-gold-dark"
          />
        </div>
      ) : null}

      {collection.items.length > 0 ? (
        <div className="mx-auto mt-8 w-full max-w-md">
          <LocalSearchInput placeholder="ابحث في هذا القسم..." />
        </div>
      ) : null}

      {collection.items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70">
          لا توجد ملفات في هذا القسم بعد.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70">
          لا توجد نتائج
        </p>
      ) : (
        <MediaGallery items={items} layout={collection.imageDisplayMode} />
      )}
    </main>
  );
}
