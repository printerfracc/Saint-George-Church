import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import KhedmaEditor from "@/components/admin/KhedmaEditor";
import { getKhedma } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "محرر الخدمة",
};

export default async function AdminKhedmaEditorPage({
  params,
}: {
  params: Promise<{ id: string; khedmaId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const { id, khedmaId } = await params;
  const data = await getKhedma(id, khedmaId);

  if (!data) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <KhedmaEditor tawze3a={data.tawze3a} initialKhedma={data.khedma} />
    </main>
  );
}
