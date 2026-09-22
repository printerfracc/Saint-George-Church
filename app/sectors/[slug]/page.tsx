import Link from "next/link";
import { notFound } from "next/navigation";
import ChurchLogo from "@/components/ChurchLogo";
import ImageCarousel from "@/components/public/ImageCarousel";
import ReadMoreText from "@/components/public/ReadMoreText";
import SectorMetaInfo from "@/components/public/SectorMetaInfo";
import { getService } from "@/actions/admin-actions";
import SectorCard from "@/components/public/SectorCard";
import { imageDisplayFrameClass } from "@/lib/image-display";
import { recordPageMetadata } from "@/lib/seo";
import { publicItemPath } from "@/lib/slug";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getService(slug);

  return recordPageMetadata({
    title: sector?.title,
    description: sector?.description,
    imageUrl: sector?.imageUrl,
    fallbackTitle: "قطاعات الخدمات",
  });
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = await getService(slug);

  if (!sector) {
    notFound();
  }

  const title = sector.title.trim() || "قطاع خدمة";
  const description = sector.description.trim();
  const hasChildren = sector.children.length > 0;
  const backHref = sector.parent ? publicItemPath("sectors", sector.parent) : "/sectors";
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
                slug={child.slug}
                title={child.title}
                imageUrl={child.imageUrl}
                childCount={child.childCount}
                imageDisplayMode={child.imageDisplayMode}
                description={child.description}
                serviceTime={child.serviceTime}
                amenPhone={child.amenPhone}
                imageUrls={child.imageUrls}
                clickable={false}
              />
            </li>
          ))}
        </ul>
      ) : (
        <article className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm">
          <ImageCarousel
            images={sector.imageUrls}
            alt={title}
            frameClassName={imageDisplayFrameClass(sector.imageDisplayMode)}
          />
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
            <SectorMetaInfo
              serviceTime={sector.serviceTime}
              amenPhone={sector.amenPhone}
            />
          </div>
        </article>
      )}
    </main>
  );
}
