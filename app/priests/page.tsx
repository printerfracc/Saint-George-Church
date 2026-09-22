import OptionalImage from "@/components/public/OptionalImage";
import PlaceholderPage from "@/components/public/PlaceholderPage";
import ReadMoreText from "@/components/public/ReadMoreText";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  formatPartialDate,
  parseContactNumbers,
  priestDateValue,
  toPhoneHref,
  toWhatsAppUrl,
} from "@/lib/admin-labels";
import { prisma } from "@/lib/prisma";
import { hasFilledText } from "@/lib/content";
import { ensurePriestColumns } from "@/actions/priests";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "الآباء الكهنة",
  "آباء كهنة كنيسة الشهيد العظيم مارجرجس بالمطرية: نبذة تعريفية، مواعيد الاعتراف، ووسائل التواصل.",
);

export default async function PriestsPage() {
  let priests: Awaited<ReturnType<typeof prisma.priest.findMany>> = [];

  try {
    await ensurePriestColumns();
    priests = await prisma.priest.findMany({
      orderBy: { order: "asc" },
    });
  } catch {
    priests = [];
  }

  return (
    <PlaceholderPage title="الآباء الكهنة">
      <p>
        تعرفوا على آباء الكنيسة ومواعيد الاعتراف. يمكنكم التواصل معهم لترتيب
        الاعتراف أو المشورة الروحية.
      </p>

      {priests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-8 text-center">
          سيتم نشر أسماء الآباء الكهنة ومواعيد الاعتراف قريباً.
        </p>
      ) : (
        <ul className="space-y-6">
          {priests.map((priest) => (
            <li
              key={priest.id}
              className="overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6">
                <OptionalImage
                  src={priest.cloudinaryImageUrl}
                  alt={priest.name}
                  width={112}
                  height={112}
                  frameClassName="mx-auto shrink-0 sm:mx-0"
                  className="h-28 w-28 rounded-full border-4 border-coptic-gold-main object-cover"
                />

                <div className="min-w-0 flex-1 text-center sm:text-right">
                  <h2 className="text-2xl font-bold text-coptic-gold-dark">
                    {priest.name}
                  </h2>
                  {hasFilledText(priest.qommosiyaDegree) ? (
                    <p className="mt-1 text-sm font-bold text-coptic-gold-dark">
                      درجة القمصية: {priest.qommosiyaDegree}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-coptic-gold-main">
                    تاريخ الرسامة: {formatPartialDate(priestDateValue(priest.ordinationDateText, priest.ordinationDate))}
                  </p>
                  {priestDateValue(priest.deathDateText, priest.deathDate) ? (
                    <p className="mt-1 text-sm text-coptic-gold-main">
                      تاريخ النياحة: {formatPartialDate(priestDateValue(priest.deathDateText, priest.deathDate))}
                    </p>
                  ) : null}

                  {priest.bio ? (
                    <div className="mt-5 rounded-2xl border-r-4 border-coptic-gold-main bg-coptic-gold-light/20 px-4 py-3 text-right">
                      <p className="text-xs font-bold tracking-wide text-coptic-gold-main">
                        نبذه عن الكاهن
                      </p>
                      <ReadMoreText
                        text={priest.bio}
                        lines={5}
                        className="mt-1 font-light italic leading-7 text-coptic-gold-dark"
                        buttonClassName="text-coptic-gold-dark"
                      />
                    </div>
                  ) : null}

                  {hasFilledText(priest.confessionSchedule) ? (
                    <div className="mt-4 rounded-2xl bg-gray-900 px-4 py-3 text-right">
                      <p className="text-xs font-bold text-coptic-gold-light">
                        مواعيد الاعترافات
                      </p>
                      <p className="mt-1 whitespace-pre-line text-lg font-bold leading-8 text-cream">
                        {priest.confessionSchedule}
                      </p>
                    </div>
                  ) : null}

                  {parseContactNumbers(priest.contactNumbers).length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-coptic-gold-main/40 bg-cream px-4 py-3 text-right">
                      <p className="text-xs font-bold text-coptic-gold-dark">
                        أرقام التواصل
                      </p>
                      <ul className="mt-3 space-y-2">
                        {parseContactNumbers(priest.contactNumbers).map((number) => (
                          <li
                            key={number}
                            className="flex items-center justify-start gap-2 rounded-xl bg-white px-3 py-2"
                          >
                            <a
                              href={toPhoneHref(number)}
                              dir="ltr"
                              className="inline-flex min-h-11 min-w-0 flex-1 items-center font-mono text-base font-bold tracking-wider text-coptic-gold-dark transition-colors hover:text-coptic-gold-main"
                            >
                              {number}
                            </a>
                            <a
                              href={toWhatsAppUrl(number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:opacity-90"
                              aria-label={`واتساب ${number}`}
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PlaceholderPage>
  );
}
