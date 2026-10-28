import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  listNewsEvents,
  listSermons,
  listServices,
} from "@/actions/admin-actions";
import { listActivities } from "@/actions/activities";
import { listContent } from "@/actions/content";
import { listPriests } from "@/actions/priests";
import { listLiturgyEntries } from "@/actions/liturgies";
import { listLibraryCollections } from "@/actions/media";
import { listPrayerRequests } from "@/actions/contact";
import { listRelics } from "@/actions/relics";
import { authOptions } from "@/lib/auth";
import { CHURCH_NAME } from "@/lib/church";

export const metadata = {
  title: "لوحة التحكم",
};

const cards = [
  { href: "/admin/content", label: "أقسام المحتوى", key: "content" },
  { href: "/admin/liturgies", label: "صلوات الكنيسة", key: "liturgies" },
  { href: "/admin/relics", label: "المزار والرفات", key: "relics" },
  { href: "/admin/activities", label: "الأنشطة والخدمات", key: "activities" },
  { href: "/admin/priests", label: "إجمالي الكهنة", key: "priests" },
  { href: "/admin/services", label: "قطاعات الخدمات", key: "services" },
  { href: "/admin/media", label: "الوسائط والمكتبة", key: "media" },
  { href: "/admin/prayer-requests", label: "طلبات الصلاة", key: "prayers" },
  { href: "/admin/news", label: "الأخبار", key: "news" },
  { href: "/admin/sermons", label: "عدد العظات", key: "sermons" },
] as const;

const registryCards = [
  { href: "/admin/registry", label: "سجل المناسبات", detail: "المعموديات والزيجات والنياحة وتذكاراتها" },
] as const;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? "مسؤول";
  const canManageTawze3a = session?.user?.role === "TAWZE3A_ADMIN";
  const isTawze3aOnly = session?.user?.role === "TAWZE3A_ADMIN";

  let counts = {
    content: 0,
    liturgies: 0,
    relics: 0,
    activities: 0,
    priests: 0,
    services: 0,
    media: 0,
    prayers: 0,
    news: 0,
    sermons: 0,
  };

  if (!isTawze3aOnly) {
    try {
      const [
        content,
        liturgies,
        relics,
        activities,
        priests,
        services,
        media,
        prayers,
        news,
        sermons,
      ] = await Promise.all([
        listContent(),
        listLiturgyEntries(),
        listRelics(),
        listActivities(),
        listPriests(),
        listServices(),
        listLibraryCollections(),
        listPrayerRequests(),
        listNewsEvents(),
        listSermons(),
      ]);

      counts = {
        content: content.length,
        liturgies: liturgies.filter((entry) => entry.section !== "LIVE").length,
        relics: relics.length,
        activities: activities.length,
        priests: priests.length,
        services: services.length,
        media: media.length,
        prayers: prayers.length,
        news: news.length,
        sermons: sermons.length,
      };
    } catch {
      counts = {
        content: 0,
        liturgies: 0,
        relics: 0,
        activities: 0,
        priests: 0,
        services: 0,
        media: 0,
        prayers: 0,
        news: 0,
        sermons: 0,
      };
    }
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <h1 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold break-words text-transparent md:text-3xl">
        مرحباً، {userName}
      </h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-coptic-gold-dark/80">
        أهلاً بك في لوحة التحكم الخاصة ب{CHURCH_NAME}.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isTawze3aOnly
          ? registryCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
              >
                <p className="text-sm font-bold text-coptic-gold-dark/80">{card.label}</p>
                <p className="mt-3 text-base font-bold text-coptic-gold-dark">{card.detail}</p>
              </Link>
            ))
          : null}
        {!isTawze3aOnly
          ? cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
              >
                <p className="text-sm font-bold text-coptic-gold-dark/80">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-bold text-coptic-gold-dark">
                  {counts[card.key]}
                </p>
              </Link>
            ))
          : null}
        {!isTawze3aOnly ? (
          <>
            <Link
              href="/admin/eed-content"
              className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
            >
              <p className="text-sm font-bold text-coptic-gold-dark/80">محتوى عيد الخدام</p>
              <p className="mt-3 text-base font-bold text-coptic-gold-dark">الهدف والشعار</p>
            </Link>
            <Link
              href="/admin/gallery"
              className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
            >
              <p className="text-sm font-bold text-coptic-gold-dark/80">إدارة الصور</p>
              <p className="mt-3 text-base font-bold text-coptic-gold-dark">معرض الصور</p>
            </Link>
          </>
        ) : null}
        {canManageTawze3a ? (
          <>
            <Link
              href="/admin/tawze3a"
              className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
            >
              <p className="text-sm font-bold text-coptic-gold-dark/80">إدارة التوزيعة</p>
              <p className="mt-3 text-base font-bold text-coptic-gold-dark">التوزيعات</p>
            </Link>
            <Link
              href="/admin/servants"
              className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
            >
              <p className="text-sm font-bold text-coptic-gold-dark/80">إدارة الخدام</p>
              <p className="mt-3 text-base font-bold text-coptic-gold-dark">سجل الخدام</p>
            </Link>
            <Link
              href="/admin/birthdays"
              className="flex min-h-11 flex-col rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-coptic-gold-main"
            >
              <p className="text-sm font-bold text-coptic-gold-dark/80">أعياد الميلاد</p>
              <p className="mt-3 text-base font-bold text-coptic-gold-dark">اليوم والأيام القريبة</p>
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
