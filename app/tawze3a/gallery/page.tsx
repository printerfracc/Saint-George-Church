import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import PublicGallery from "@/components/public/PublicGallery";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "صور عيد الخدام",
  description: "صور وفيديوهات يوم عيد الخدام",
};

export default async function EedGalleryPage() {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
    select: { id: true },
  });

  if (!publishedTawze3a) {
    notFound();
  }

  let items: Awaited<ReturnType<typeof prisma.galleryMedia.findMany>> = [];

  try {
    items = await prisma.galleryMedia.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    items = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <p className="text-center text-sm font-bold text-coptic-gold-dark">عيد الخدام</p>
      <h1 className="mt-3 bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-5xl">
        الصور
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        صور وفيديوهات يوم عيد الخدام
      </p>

      {items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-10 text-center text-deep-red/70">
          لا توجد صور بعد.
        </p>
      ) : (
        <div className="mt-10">
          <PublicGallery
            items={items.map((item) => ({
              id: item.id,
              type: item.type,
              url: item.url,
            }))}
          />
        </div>
      )}
    </main>
  );
}
