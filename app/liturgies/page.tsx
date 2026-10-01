import ChurchLogo from "@/components/ChurchLogo";
import HashScroll from "@/components/HashScroll";
import OptionalImage from "@/components/public/OptionalImage";
import LinkButton from "@/components/public/LinkButton";
import ChurchLiveStream from "@/components/live/ChurchLiveStream";
import LiturgyScheduleTable from "@/components/public/LiturgyScheduleTable";
import ReadMoreText from "@/components/public/ReadMoreText";
import { listLiturgyEntries } from "@/actions/liturgies";
import { PUBLIC_LITURGY_SECTIONS } from "@/lib/liturgies";
import { publicPageMetadata } from "@/lib/seo";
import { searchItemAnchor } from "@/lib/search";

export const metadata = publicPageMetadata(
  "صلوات الكنيسة",
  "صلوات كنيسة الشهيد العظيم مارجرجس بالمطرية: مواعيد القداسات، البث المباشر، والطقوس الكنسية.",
);

export const revalidate = 60;

export default async function LiturgiesPage() {
  let entries: Awaited<ReturnType<typeof listLiturgyEntries>> = [];

  try {
    entries = await listLiturgyEntries();
  } catch {
    entries = [];
  }

  const visibleSections = PUBLIC_LITURGY_SECTIONS.map((section) => ({
    ...section,
    items: entries.filter((entry) => entry.section === section.key),
  })).filter((section) => section.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16">
      <HashScroll />
      <div className="mb-6 flex justify-center">
        <ChurchLogo size={96} className="h-20 w-20" />
      </div>
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        صلوات الكنيسة
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
      <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-8 text-deep-red/80 md:text-base">
        تابع مواعيد القداسات، البث المباشر، والطقوس والأسرار.
      </p>

      <div className="mt-10 space-y-12">
        {visibleSections
          .filter((section) => section.key === "SCHEDULE")
          .map((section) => (
            <section
              key={section.key}
              id="schedule"
              aria-labelledby={`liturgy-${section.key}`}
            >
              <h2
                id={`liturgy-${section.key}`}
                className="text-2xl font-bold text-coptic-gold-dark"
              >
                {section.label}
              </h2>
              <div className="mt-2 h-1 w-14 rounded-full bg-coptic-gold-main" />
              <LiturgyScheduleTable items={section.items} />
            </section>
          ))}

        <section id="live" aria-labelledby="liturgy-LIVE">
          <h2 id="liturgy-LIVE" className="text-2xl font-bold text-coptic-gold-dark">
            البث المباشر
          </h2>
          <div className="mt-2 h-1 w-14 rounded-full bg-coptic-gold-main" />
          <ChurchLiveStream />
        </section>

        {visibleSections
          .filter((section) => section.key !== "SCHEDULE")
          .map((section) => (
            <section
              key={section.key}
              id="rites"
              aria-labelledby={`liturgy-${section.key}`}
            >
              <h2
                id={`liturgy-${section.key}`}
                className="text-2xl font-bold text-coptic-gold-dark"
              >
                {section.label}
              </h2>
              <div className="mt-2 h-1 w-14 rounded-full bg-coptic-gold-main" />
              <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.items.map((item) => {
                  const title = item.title.trim();
                  const description = item.description.trim();
                  const detail = item.detail?.trim() ?? "";
                  const href = item.link?.trim() || "";

                  return (
                    <li
                      key={item.id}
                      id={searchItemAnchor(item.id)}
                      className="scroll-mt-24 overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm"
                    >
                      <OptionalImage
                        src={item.imageUrl}
                        alt={title || section.label}
                        fill
                        frameClassName="relative aspect-video"
                        className="object-cover"
                      />
                      {title || description || detail || href ? (
                        <div className="p-5">
                          {title ? (
                            <h3 className="text-lg font-bold text-deep-red">{title}</h3>
                          ) : null}
                          {detail ? (
                            <p className="mt-1 text-sm font-bold text-coptic-gold-dark">
                              {detail}
                            </p>
                          ) : null}
                          {description ? (
                            <ReadMoreText
                              text={description}
                              className="mt-2 whitespace-pre-line text-sm leading-7 text-deep-red/75"
                              buttonClassName="text-coptic-gold-dark"
                            />
                          ) : null}
                          {href ? (
                            <LinkButton href={href} label={item.linkLabel} />
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </div>
    </main>
  );
}
