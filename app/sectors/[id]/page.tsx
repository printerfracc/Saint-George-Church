import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import ReadMoreText from "@/components/public/ReadMoreText";
import { getService } from "@/actions/admin-actions";
import SectorCard from "@/components/public/SectorCard";
import { imageDisplayFrameClass } from "@/lib/image-display";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sector = await getService(id);

  return {
    title: sector?.title ?? "قطاعات الخدمات",
  };
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sector = await getService(id);

  if (!sector) {
    notFound();
  }

  const title = sector.title.trim() || "قطاع خدمة";
  const description = sector.description.trim();
  const hasChildren = sector.children.length > 0;
  const backHref = sector.parent ? `/sectors/${sector.parent.id}` : "/sectors";
  const backLabel = sector.parent ? sector.parent.title : "قطاعات الخدمات";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <p className="text-center">
        <Link href={backHref} className="text-sm font-bold text-coptic-gold-dark">
          {backLabel}
        </Link>
      </p>
      <h1 className="mt-3 bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        {title}
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />

      {hasChildren ? (
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sector.children.map((child) => (
            <li key={child.id}>
              <SectorCard
                id={child.id}
                title={child.title}
                imageUrl={child.imageUrl}
                childCount={child.childCount}
                imageDisplayMode={child.imageDisplayMode}
              />
            </li>
          ))}
        </ul>
      ) : (
        <article className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm">
          {sector.imageUrl ? (
            <div className={imageDisplayFrameClass(sector.imageDisplayMode)}>
              <Image
                src={sector.imageUrl}
                alt={title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="p-6 md:p-8">
            {description ? (
              <ReadMoreText
                text={description}
                lines={8}
                className="text-sm leading-8 text-deep-red/80 md:text-base"
                buttonClassName="text-coptic-gold-dark"
              />
            ) : (
              <p className="text-center text-sm text-deep-red/70">
                لا توجد تفاصيل منشورة لهذا القطاع بعد.
              </p>
            )}
          </div>
        </article>
      )}
    </main>
  );
}
