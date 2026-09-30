import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import KhedmaEditor from "@/components/admin/KhedmaEditor";
import { getKhedma } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { parseYear } from "@/lib/tawze3a-year";

export const metadata = {
  title: "محرر الخدمة",
};

export default async function AdminKhedmaEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; khedmaId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const [{ id, khedmaId }, { year }] = await Promise.all([params, searchParams]);
  const selectedYear = parseYear(year);
  const data = await getKhedma(id, khedmaId, selectedYear);

  if (!data) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <KhedmaEditor
        tawze3a={data.tawze3a}
        initialKhedma={data.khedma}
        selectedYear={selectedYear}
      />
    </main>
  );
}
