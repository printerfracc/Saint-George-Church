import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Tawze3aBuilder from "@/components/admin/Tawze3aBuilder";
import { getTawze3a } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "محرر التوزيعة",
};

export default async function AdminTawze3aEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const { id } = await params;
  const tawze3a = await getTawze3a(id);

  if (!tawze3a) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <Tawze3aBuilder initialTawze3a={tawze3a} />
    </main>
  );
}
