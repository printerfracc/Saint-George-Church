import Link from "next/link";
import ChurchLogo from "@/components/ChurchLogo";

export type PillarItem = {
  title: string;
  description?: string;
  href?: string;
};

export default function PillarPage({
  title,
  intro,
  items,
}: {
  title: string;
  intro: string;
  items: PillarItem[];
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        {title}
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        {intro}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => {
          const body = (
            <>
              <h2 className="text-xl font-bold text-deep-red">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-deep-red/70">
                {item.description ?? "سيتم نشر التفاصيل قريباً."}
              </p>
            </>
          );

          const className =
            "block h-full rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-coptic-gold-main";

          if (item.href) {
            return (
              <Link key={item.title} href={item.href} className={className}>
                {body}
              </Link>
            );
          }

          return (
            <section key={item.title} className={className}>
              {body}
            </section>
          );
        })}
      </div>
    </main>
  );
}
