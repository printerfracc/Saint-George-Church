import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import KhedmaEditor from "@/components/admin/KhedmaEditor";
import { getKhedma } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordPageMetadata } from "@/lib/seo";
import { parseYear } from "@/lib/tawze3a-year";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; khedmaId: string }>;
}): Promise<Metadata> {
  const { id, khedmaId } = await params;
  const khedma = await prisma.khedma
    .findFirst({
      where: { id: khedmaId, tawze3aId: id },
      select: { name: true, logoUrl: true },
    })
    .catch(() => null);

  return recordPageMetadata({
    title: khedma?.name,
    description: khedma?.name,
    imageUrl: khedma?.logoUrl,
    fallbackTitle: "محرر الخدمة",
    path: `/admin/tawze3a/${id}/khedma/${khedmaId}`,
  });
}

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
