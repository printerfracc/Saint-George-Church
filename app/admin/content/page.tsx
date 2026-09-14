import ContentManager from "@/components/admin/ContentManager";
import { listContent } from "@/actions/content";

export const metadata = {
  title: "إدارة محتوى الصفحات",
};

export default async function AdminContentPage() {
  let records: Awaited<ReturnType<typeof listContent>> = [];

  try {
    records = await listContent();
  } catch {
    records = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <ContentManager
        records={records.map((record) => ({
          id: record.id,
          sectionKey: record.sectionKey,
          title: record.title,
          content: record.content,
          imageUrl: record.imageUrl,
          updatedAt: record.updatedAt.toISOString(),
        }))}
      />
    </main>
  );
}
