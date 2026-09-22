import Link from "next/link";
import OptionalImage from "@/components/public/OptionalImage";
import { imageDisplayFrameClass } from "@/lib/image-display";

export default function SectorCard({
  id,
  slug,
  title,
  imageUrl,
  childCount,
  imageDisplayMode,
}: {
  id: string;
  slug?: string | null;
  title: string;
  imageUrl: string | null;
  childCount: number;
  imageDisplayMode?: string | null;
}) {
  const label = title.trim() || "قطاع خدمة";

  return (
    <article className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-coptic-gold-main">
      <Link href={`/sectors/${slug || id}`} className="block">
        <OptionalImage
          src={imageUrl}
          alt={label}
          fill
          frameClassName={imageDisplayFrameClass(imageDisplayMode)}
          className="object-cover"
        />
        <div className="p-5">
          <h2 className="text-lg font-bold text-deep-red">{label}</h2>
          {childCount > 0 ? (
            <p className="mt-2 text-xs font-bold text-coptic-gold-dark">
              {childCount} قسم فرعي
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
