import SermonManager from "@/components/admin/SermonManager";
import { listSermons } from "@/actions/admin-actions";
import { listPriests } from "@/actions/priests";

export const metadata = {
  title: "إدارة العظات",
};

export default async function AdminSermonsPage() {
  let sermons: Awaited<ReturnType<typeof listSermons>> = [];
  let priests: Awaited<ReturnType<typeof listPriests>> = [];

  try {
    [sermons, priests] = await Promise.all([listSermons(), listPriests()]);
  } catch {
    sermons = [];
    priests = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <SermonManager
        priests={priests.map((priest) => ({ id: priest.id, name: priest.name }))}
        sermons={sermons.map((sermon) => ({
          id: sermon.id,
          title: sermon.title,
          mediaUrl: sermon.mediaUrl,
          date: sermon.date.toISOString(),
          priestId: sermon.priestId,
          priestName: sermon.priest.name,
        }))}
      />
    </main>
  );
}
