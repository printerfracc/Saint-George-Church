import Link from "next/link";
import ChurchLogo from "@/components/ChurchLogo";

export const metadata = {
  title: "الصفحة غير موجودة",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <section className="rounded-2xl border border-gold/60 bg-white/85 p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <ChurchLogo size={96} className="h-20 w-20" />
        </div>
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gold" />
        <p className="text-sm font-bold text-gold">٤٠٤</p>
        <h1 className="mt-2 text-2xl font-bold text-deep-red">
          الصفحة غير موجودة
        </h1>
        <p className="mt-4 text-sm leading-8 text-deep-red/80">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. تحقق من الرابط
          أو عد إلى الصفحة الرئيسية.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-deep-red px-6 text-sm font-bold text-cream transition hover:bg-deep-red/90"
        >
          العودة للرئيسية
        </Link>
      </section>
    </main>
  );
}
