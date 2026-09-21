import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaTiDBCloud({ url: connectionString }),
});

async function main() {
  const [assignments, categories, roles] = await Promise.all([
    prisma.servantAssignment.count(),
    prisma.khedmaCategory.count(),
    prisma.servantRole.count(),
  ]);

  console.log(
    JSON.stringify({
      message: "Servant roles are created only from the Excel Role column. This script no longer seeds defaults.",
      servantAssignments: assignments,
      khedmaCategories: categories,
      servantRoles: roles,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
