"use client";

import type { ImageDisplayMode } from "@/lib/image-display";

const OPTIONS: Array<{ value: ImageDisplayMode; label: string }> = [
  { value: "NORMAL", label: "التصميم العادي" },
  { value: "PORTRAIT_450_730", label: "غلاف كتاب (450×730)" },
];

export default function ImageDisplayModeField({
  value,
  onChange,
}: {
  value: ImageDisplayMode;
  onChange: (value: ImageDisplayMode) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-deep-red">حجم عرض الصورة</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-bold transition ${
                selected
                  ? "border-coptic-gold-main bg-coptic-gold-main/15 text-deep-red"
                  : "border-coptic-gold-main/40 bg-white text-deep-red/80 hover:border-coptic-gold-main"
              }`}
            >
              <input
                type="radio"
                name="imageDisplayMode"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
