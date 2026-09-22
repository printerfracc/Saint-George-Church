import Link from "next/link";
import ImageCarousel from "@/components/public/ImageCarousel";
import OptionalImage from "@/components/public/OptionalImage";
import ReadMoreText from "@/components/public/ReadMoreText";
import SectorMetaInfo from "@/components/public/SectorMetaInfo";
import { imageDisplayFrameClass } from "@/lib/image-display";

export default function SectorCard({
  id,
  slug,
  title,
  imageUrl,
  childCount,
  imageDisplayMode,
  description,
  serviceTime,
  amenPhone,
  imageUrls,
  clickable = true,
}: {
  id: string;
  slug?: string | null;
  title: string;
  imageUrl: string | null;
  childCount: number;
  imageDisplayMode?: string | null;
  description?: string | null;
  serviceTime?: string | null;
  amenPhone?: string | null;
  imageUrls?: string[];
  clickable?: boolean;
}) {
  const label = title.trim() || "قطاع خدمة";
  const photos = (imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []).filter(Boolean);
  const frameClass = imageDisplayFrameClass(imageDisplayMode);
  const media = clickable ? (
    <OptionalImage
      src={photos[0]}
      alt={label}
      fill
      frameClassName={frameClass}
      className="object-cover"
    />
  ) : (
    <ImageCarousel images={photos} alt={label} frameClassName={frameClass} />
  );

  const details = (
    <div className="p-5">
      <h2 className="text-lg font-bold text-deep-red">{label}</h2>
      {clickable && childCount > 0 ? (
        <p className="mt-2 text-xs font-bold text-coptic-gold-dark">
          {childCount} قسم فرعي
        </p>
      ) : null}
      {!clickable ? (
        <>
          <ReadMoreText
            text={description}
            className="mt-2 whitespace-pre-line text-sm leading-7 text-deep-red/75"
            buttonClassName="text-coptic-gold-dark"
          />
          <SectorMetaInfo serviceTime={serviceTime} amenPhone={amenPhone} />
        </>
      ) : null}
    </div>
  );

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm ${
        clickable ? "transition hover:-translate-y-0.5 hover:border-coptic-gold-main" : ""
      }`}
    >
      {clickable ? (
        <Link href={`/sectors/${slug || id}`} className="block">
          {media}
          {details}
        </Link>
      ) : (
        <>
          {media}
          {details}
        </>
      )}
    </article>
  );
}
