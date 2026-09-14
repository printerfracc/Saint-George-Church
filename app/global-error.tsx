"use client";

import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream text-deep-red font-sans">
        <title>تعذر تحميل الموقع</title>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <section className="rounded-2xl border border-gold/60 bg-white/85 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gold" />
            <h1 className="text-2xl font-bold text-deep-red">
              تعذر تحميل الموقع
            </h1>
            <p className="mt-4 text-sm leading-8 text-deep-red/80">
              حدث خطأ في الخادم. يرجى المحاولة مرة أخرى بعد لحظات.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-deep-red px-6 text-sm font-bold text-cream transition hover:bg-deep-red/90"
            >
              إعادة المحاولة
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
