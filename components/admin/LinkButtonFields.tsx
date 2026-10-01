import { DEFAULT_LINK_BUTTON_LABEL } from "@/lib/link-button";

export default function LinkButtonFields({
  link,
  linkLabel,
  onLinkChange,
  onLinkLabelChange,
}: {
  link: string;
  linkLabel: string;
  onLinkChange: (value: string) => void;
  onLinkLabelChange: (value: string) => void;
}) {
  return (
    <>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-deep-red">رابط التوجيه (اختياري)</span>
        <input
          type="text"
          dir="ltr"
          value={link}
          onChange={(event) => onLinkChange(event.target.value)}
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-left text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
          aria-label="رابط التوجيه"
        />
        <span className="block text-xs leading-6 text-deep-red/70">
          يمكنك كتابة رابط داخلي يبدأ بـ / أو رابط خارجي كامل.
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-bold text-deep-red">تسمية الزر (اختياري)</span>
        <input
          type="text"
          value={linkLabel}
          onChange={(event) => onLinkLabelChange(event.target.value)}
          placeholder={DEFAULT_LINK_BUTTON_LABEL}
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
          aria-label="تسمية الزر"
        />
        <span className="block text-xs leading-6 text-deep-red/70">
          يظهر هذا النص على الزر. إذا وُجد رابط بدون تسمية سيُستخدم «{DEFAULT_LINK_BUTTON_LABEL}».
        </span>
      </label>
    </>
  );
}
