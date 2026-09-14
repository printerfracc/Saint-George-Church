import PriestManager from "@/components/admin/PriestManager";
import { listPriests } from "@/actions/priests";

export const metadata = {
  title: "إدارة الكهنة",
};

export default async function AdminPriestsPage() {
  let priests: Awaited<ReturnType<typeof listPriests>> = [];

  try {
    priests = await listPriests();
  } catch {
    priests = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <PriestManager
        priests={priests.map((priest) => ({
          id: priest.id,
          name: priest.name,
          cloudinaryImageUrl: priest.cloudinaryImageUrl,
          ordinationDate: priest.ordinationDate.toISOString(),
          confessionSchedule: priest.confessionSchedule,
          bio: priest.bio,
          contactNumbers: priest.contactNumbers,
        }))}
      />
    </main>
  );
}
