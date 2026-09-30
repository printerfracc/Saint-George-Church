import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Tawze3aBuilder from "@/components/admin/Tawze3aBuilder";
import { getTawze3a } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { parseYear } from "@/lib/tawze3a-year";

export const metadata = {
  title: "محرر التوزيعة",
};

export default async function AdminTawze3aEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const [{ id }, { year }] = await Promise.all([params, searchParams]);
  const selectedYear = parseYear(year);
  const tawze3a = await getTawze3a(id, selectedYear);

  if (!tawze3a) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <Tawze3aBuilder
        initialTawze3a={tawze3a}
        selectedYear={selectedYear}
      />
    </main>
  );
}
