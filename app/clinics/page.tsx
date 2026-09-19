import ReadMoreText from "@/components/public/ReadMoreText";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "العيادات",
  "عيادات كنيسة الشهيد العظيم مارجرجس بالمطرية ومواعيد الخدمة الطبية.",
);

export default async function ClinicsPage() {
  let clinics: { id: string; title: string; description: string; schedule: string }[] =
    [];

  try {
    clinics = await prisma.service.findMany({
      where: { type: "MEDICAL" },
      orderBy: { order: "asc" },
    });
  } catch {
    try {
      clinics = await prisma.service.findMany({
        where: { type: "MEDICAL" },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      clinics = [];
    }
  }

  return (
    <main id="clinics" className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-12">
      <h1 className="text-3xl font-bold text-deep-red">العيادات</h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gold" />
      <p className="mt-4 text-sm leading-8 text-deep-red/75">
        الخدمات الطبية والعيادات التابعة للكنيسة.
      </p>

      {clinics.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-gold/50 bg-white/70 px-4 py-8 text-center text-sm text-deep-red/70">
          لا توجد عيادات معلنة حالياً. تابعونا قريباً.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {clinics.map((clinic) => (
            <li
              key={clinic.id}
              className="rounded-2xl border border-gold/40 bg-white/80 p-5"
            >
              <h2 className="text-lg font-bold text-deep-red">{clinic.title}</h2>
              <ReadMoreText
                text={clinic.description}
                className="mt-2 whitespace-pre-line text-sm leading-7 text-deep-red/75"
                buttonClassName="text-coptic-gold-dark"
              />
              <p className="mt-3 text-sm font-bold text-gold">{clinic.schedule}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
