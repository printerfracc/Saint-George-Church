import { toPhoneHref } from "@/lib/admin-labels";
import { hasFilledText } from "@/lib/content";

export default function SectorMetaInfo({
  serviceTime,
  amenPhone,
}: {
  serviceTime?: string | null;
  amenPhone?: string | null;
}) {
  const time = serviceTime?.trim() ?? "";
  const phone = amenPhone?.trim() ?? "";

  if (!hasFilledText(time) && !hasFilledText(phone)) {
    return null;
  }

  return (
    <dl className="mt-4 space-y-2 rounded-2xl border border-coptic-gold-main/25 bg-cream/90 px-3 py-3">
      {hasFilledText(time) ? (
        <div className="flex items-start gap-2">
          <dt className="shrink-0 rounded-full bg-coptic-gold-main/20 px-2.5 py-1 text-xs font-bold text-coptic-gold-dark">
            ميعاد الخدمة
          </dt>
          <dd className="pt-0.5 text-sm font-medium leading-6 text-deep-red">{time}</dd>
        </div>
      ) : null}
      {hasFilledText(phone) ? (
        <div className="flex items-center gap-2">
          <dt className="shrink-0 rounded-full bg-deep-red/10 px-2.5 py-1 text-xs font-bold text-deep-red">
            رقم الأمين
          </dt>
          <dd>
            <a
              href={toPhoneHref(phone)}
              dir="ltr"
              className="text-sm font-bold tracking-wide text-deep-red underline-offset-4 hover:underline"
            >
              {phone}
            </a>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
