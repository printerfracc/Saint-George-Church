import { prisma } from "@/lib/prisma";

/** Sequential deletes — TiDB HTTP adapter does not reliably support $transaction batches. */
export async function wipeServantRolesAndCategories() {
  await prisma.servantAssignment.deleteMany();
  await prisma.khedmaCategory.deleteMany();
  await prisma.servantRole.deleteMany();
  await prisma.khedma.deleteMany();
}
