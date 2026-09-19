import Image from "next/image";
import Link from "next/link";
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
  const frameClass = imageDisplayFrameClass(imageDisplayMode);

  return (
    <article className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-coptic-gold-main">
      <Link href={`/sectors/${slug || id}`} className="block">
        {imageUrl ? (
          <div className={frameClass}>
            <Image
              src={imageUrl}
              alt={label}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center bg-cream text-sm font-bold text-coptic-gold-dark ${frameClass}`}>
            {label.slice(0, 1)}
          </div>
        )}
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
