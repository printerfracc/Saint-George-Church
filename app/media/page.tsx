import Image from "next/image";
import Link from "next/link";
import ChurchLogo from "@/components/ChurchLogo";
import { listLibraryCollections } from "@/actions/media";

export const metadata = {
  title: "الوسائط والمكتبة",
};

export const revalidate = 60;

export default async function MediaPage() {
  let collections: Awaited<ReturnType<typeof listLibraryCollections>> = [];

  try {
    collections = await listLibraryCollections();
  } catch {
    collections = [];
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        الوسائط والمكتبة
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        صور، كتب، وملفات روحية تُنشر من إدارة الموقع.
      </p>

      {collections.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70">
          سيتم نشر أقسام الوسائط والمكتبة قريباً.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={`/media/${collection.id}`}
                className="block overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-coptic-gold-main"
              >
                {collection.imageUrl ? (
                  <div className="relative aspect-video">
                    <Image
                      src={collection.imageUrl}
                      alt={collection.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-deep-red">
                    {collection.title}
                  </h2>
                  {collection.description ? (
                    <p className="mt-2 text-sm leading-7 text-deep-red/75">
                      {collection.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-bold text-coptic-gold-dark">
                    {collection.itemCount} ملف
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
