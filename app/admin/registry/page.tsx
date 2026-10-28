export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import RegistryManager from "@/components/admin/RegistryManager";
import { prisma } from "@/lib/prisma";
import { requireRegistryAdmin } from "@/lib/require-admin";
import {
  parseRegistryTab,
  serializeBaptism,
  serializeDeparted,
  serializeMarriage,
  sortByEventDateDesc,
} from "@/lib/registry";

export const metadata = {
  title: "سجل الكنيسة",
};

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRegistryAdmin();

  if (!session) {
    redirect("/admin");
  }

  const { tab } = await searchParams;
  const [baptisms, marriages, departed] = await Promise.all([
    prisma.baptismRecord.findMany(),
    prisma.marriageRecord.findMany(),
    prisma.departedRecord.findMany(),
  ]);

  return (
    <main className="px-4 py-8 md:px-8">
      <RegistryManager
        initialTab={parseRegistryTab(tab)}
        baptisms={sortByEventDateDesc(baptisms.map(serializeBaptism), (item) => item.baptismDate)}
        marriages={sortByEventDateDesc(marriages.map(serializeMarriage), (item) => item.weddingDate)}
        departed={sortByEventDateDesc(departed.map(serializeDeparted), (item) => item.funeralDate)}
      />
    </main>
  );
}
