import { createRelic, deleteRelic, listRelics, updateRelic } from "@/actions/relics";
import NamedItemManager from "@/components/admin/NamedItemManager";

export const metadata = {
  title: "إدارة المزار والرفات",
};

export default async function AdminRelicsPage() {
  let relics: Awaited<ReturnType<typeof listRelics>> = [];

  try {
    relics = await listRelics();
  } catch {
    relics = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <NamedItemManager
        title="إدارة المزار والرفات"
        addLabel="إضافة مزار"
        emptyLabel="لا توجد رفات أو مزارات بعد"
        deleteConfirm="هل تريد حذف هذا المزار؟"
        preview="relic"
        items={relics.map((relic) => ({
          id: relic.id,
          name: relic.name,
          description: relic.description,
          imageUrl: relic.imageUrl,
        }))}
        onCreate={createRelic}
        onUpdate={updateRelic}
        onDelete={deleteRelic}
      />
    </main>
  );
}
