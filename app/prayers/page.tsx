import LiturgyScheduleTable from "@/components/public/LiturgyScheduleTable";
import { listLiturgyEntries } from "@/actions/liturgies";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "مواعيد القداسات",
  "جدول مواعيد القداسات والصلوات في كنيسة الشهيد العظيم مارجرجس بالمطرية.",
);

export const revalidate = 60;

export default async function PrayersPage() {
  let items: Awaited<ReturnType<typeof listLiturgyEntries>> = [];

  try {
    const entries = await listLiturgyEntries();
    items = entries.filter((entry) => entry.section === "SCHEDULE");
  } catch {
    items = [];
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-28 pb-12">
      <h1 className="text-3xl font-bold text-deep-red">مواعيد القداسات</h1>
      <div className="mt-3 h-1 w-20 rounded-full bg-gold" />
      <p className="mt-4 text-sm leading-8 text-deep-red/75">
        جدول القداس الإلهي والصلوات في الكنيسة خلال الأسبوع.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-8 text-center text-deep-red/70">
          سيتم نشر مواعيد القداسات قريباً.
        </p>
      ) : (
        <LiturgyScheduleTable items={items} />
      )}
    </main>
  );
}
