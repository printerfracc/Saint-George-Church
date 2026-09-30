"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { publishAssignmentYear } from "@/actions/tawze3a-admin";
import { cloneYear } from "@/actions/twze3a/cloneYear";
import { adminActionGold, adminActionOutline } from "@/components/admin/admin-ui";

export function AssignmentYearSelect({
  years,
  selectedYear,
}: {
  years: number[];
  selectedYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="block text-sm font-bold text-deep-red">
      السنة
      <select
        aria-label="اختيار سنة التوزيعة"
        value={selectedYear}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("year", event.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="mt-1 min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-3 text-sm font-normal text-deep-red outline-none focus:ring-2 focus:ring-gold"
      >
        {(years ?? [selectedYear]).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DraftBadge() {
  return (
    <span className="rounded-full bg-coptic-gold-main/20 px-2 py-0.5 text-[10px] font-bold text-coptic-gold-dark">
      مسودة
    </span>
  );
}

export default function AssignmentYearTools({
  years,
  selectedYear,
}: {
  years: number[];
  selectedYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [targetYear, setTargetYear] = useState(String(selectedYear + 1));

  useEffect(() => {
    setTargetYear(String(selectedYear + 1));
  }, [selectedYear]);
  const [pending, setPending] = useState<"clone" | "publish" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleClone() {
    const nextYear = Number(targetYear);
    setPending("clone");
    setError("");
    setMessage("");

    try {
      const result = await cloneYear(selectedYear, nextYear);
      setMessage(`تم نسخ ${result.count} تعيينًا كمسودة لسنة ${nextYear}`);
      const params = new URLSearchParams(searchParams.toString());
      params.set("year", String(nextYear));
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر نسخ السنة");
    } finally {
      setPending(null);
    }
  }

  async function handlePublish() {
    setPending("publish");
    setError("");
    setMessage("");
    const result = await publishAssignmentYear(selectedYear);
    setPending(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setMessage(`تم نشر تعيينات سنة ${selectedYear}`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-coptic-gold-main/30 bg-cream/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="w-full sm:w-40">
          <AssignmentYearSelect years={years} selectedYear={selectedYear} />
        </div>
        <label className="block text-sm font-bold text-deep-red">
          نسخ إلى سنة
          <input
            type="number"
            min={1}
            max={9999}
            value={targetYear}
            onChange={(event) => setTargetYear(event.target.value)}
            aria-label="سنة الهدف للنسخ"
            className="mt-1 min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-3 text-sm font-normal text-deep-red outline-none focus:ring-2 focus:ring-gold sm:w-36"
          />
        </label>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void handleClone()}
          className={adminActionGold}
        >
          {pending === "clone" ? "جاري النسخ..." : "نسخ كمسودة"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void handlePublish()}
          className={adminActionOutline}
        >
          {pending === "publish" ? "جاري النشر..." : "نشر مسودات السنة"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm font-medium text-green-800">{message}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
