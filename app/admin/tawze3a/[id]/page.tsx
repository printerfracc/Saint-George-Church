import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Tawze3aBuilder from "@/components/admin/Tawze3aBuilder";
import { getTawze3a } from "@/actions/tawze3a-admin";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordPageMetadata } from "@/lib/seo";
import { parseYear } from "@/lib/tawze3a-year";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tawze3a = await prisma.tawze3a
    .findUnique({
      where: { id },
      select: { title: true },
    })
    .catch(() => null);

  return recordPageMetadata({
    title: tawze3a?.title,
    description: tawze3a?.title,
    fallbackTitle: "محرر التوزيعة",
    path: `/admin/tawze3a/${id}`,
  });
}

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
