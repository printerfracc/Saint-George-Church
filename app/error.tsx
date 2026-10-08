"use client";

import Link from "next/link";
import ChurchLogo from "@/components/ChurchLogo";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <section className="rounded-2xl border border-gold/60 bg-white/85 p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <ChurchLogo size={96} className="h-20 w-20" />
        </div>
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gold" />
        <h1 className="text-2xl font-bold text-deep-red">حدث خطأ غير متوقع</h1>
        <p className="mt-4 text-sm leading-8 text-deep-red/80">
          تعذر تحميل هذه الصفحة حالياً. يمكنك المحاولة مرة أخرى أو العودة إلى
          الصفحة الرئيسية.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-deep-red px-6 text-sm font-bold text-cream transition hover:bg-deep-red/90"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold px-6 text-sm font-bold text-deep-red transition hover:bg-gold/10"
          >
            العودة للرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
