"use client";

import { ARABIC_MONTHS, type PartialDateParts } from "@/lib/admin-labels";

export default function PartialDateInput({
  label,
  required = false,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: PartialDateParts;
  onChange: (value: PartialDateParts) => void;
}) {
  const year = Number(value.year);
  const month = Number(value.month);
  const daysInMonth =
    year && month
      ? new Date(year, month, 0).getDate()
      : 31;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-coptic-gold-dark">
        {label}
        {required ? "" : " (اختياري)"}
      </legend>
      <div className="grid grid-cols-3 gap-2">
        <label className="block text-xs font-bold text-coptic-gold-dark">
          السنة
          <input
            type="number"
            inputMode="numeric"
            min="1800"
            max="2100"
            value={value.year}
            required={required}
            onChange={(event) =>
              onChange({ ...value, year: event.target.value })
            }
            className="mt-1 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            aria-label={`${label} السنة`}
          />
        </label>
        <label className="block text-xs font-bold text-coptic-gold-dark">
          الشهر
          <select
            value={value.month}
            required={required}
            onChange={(event) =>
              onChange({
                ...value,
                month: event.target.value,
                day: event.target.value ? value.day : "",
              })
            }
            className="mt-1 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            aria-label={`${label} الشهر`}
          >
            <option value="">—</option>
            {ARABIC_MONTHS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-coptic-gold-dark">
          اليوم
          <select
            value={value.day}
            disabled={!value.month}
            onChange={(event) =>
              onChange({ ...value, day: event.target.value })
            }
            className="mt-1 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main disabled:opacity-60"
            aria-label={`${label} اليوم`}
          >
            <option value="">—</option>
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = String(index + 1).padStart(2, "0");
              return (
                <option key={day} value={day}>
                  {index + 1}
                </option>
              );
            })}
          </select>
        </label>
      </div>
      <p className="text-xs text-deep-red/60">اليوم اختياري</p>
    </fieldset>
  );
}
