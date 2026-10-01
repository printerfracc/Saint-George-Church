import { listLiturgyEntries } from "@/actions/liturgies";
import LiturgyManager from "@/components/admin/LiturgyManager";
import type { LiturgySectionKey } from "@/lib/liturgies";

export const metadata = {
  title: "إدارة صلوات الكنيسة",
};

export default async function AdminLiturgiesPage() {
  let entries: Awaited<ReturnType<typeof listLiturgyEntries>> = [];

  try {
    entries = await listLiturgyEntries();
  } catch {
    entries = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <LiturgyManager
        entries={entries.map((entry) => ({
          id: entry.id,
          section: entry.section as LiturgySectionKey,
          title: entry.title,
          description: entry.description,
          detail: entry.detail,
          imageUrl: entry.imageUrl,
          link: entry.link,
          linkLabel: entry.linkLabel,
        }))}
      />
    </main>
  );
}
