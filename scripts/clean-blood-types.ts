// Run with: npx tsx scripts/clean-blood-types.ts

import path from "node:path";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const bloodTypeMap: Record<string, string | null> = {
  // A Variations
  A: "A",
  "A+": "A+",
  "A +": "A+",
  "A positive": "A+",
  "A-": "A-",
  "A negative": "A-",

  // B Variations
  B: "B",
  b: "B",
  "فصيله الدم (B )": "B",
  "B+": "B+",
  "b+": "B+",
  "B.  positive": "B+",
  "B–": "B-",
  "B negative": "B-",

  // AB Variations
  AB: "AB",
  Ab: "AB",
  "AB+": "AB+",

  // O Variations
  O: "O",
  "0": "O",
  ",o": "O",
  "O+": "O+",
  "O +": "O+",
  "o+": "O+",
  "O positive": "O+",
  "0 موجب": "O+",
  "O-": "O-",
  "O سالب": "O-",
  "Oسلب": "O-",

  // Garbage & Unknowns -> map to null
  ".": null,
  "..": null,
  "...": null,
  "....": null,
  ",": null,
  "؟": null,
  "لا اعرف": null,
  "لا أعرف": null,
  "مش عارفه": null,
  "I+": null,
};

async function cleanBloodTypes() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  const { prisma } = await import("../lib/prisma");
  const servants = await prisma.servant.findMany({
    where: { bloodType: { not: null } },
    select: { id: true, name: true, bloodType: true },
  });

  let normalized = 0;
  let cleared = 0;
  let unchanged = 0;
  const unmapped = new Map<string, number>();

  try {
    for (const servant of servants) {
      const raw = servant.bloodType ?? "";
      const key = raw.trim();

      if (!key) {
        await prisma.servant.update({
          where: { id: servant.id },
          data: { bloodType: null },
        });
        cleared += 1;
        continue;
      }

      if (!Object.hasOwn(bloodTypeMap, key)) {
        unmapped.set(raw, (unmapped.get(raw) ?? 0) + 1);
        continue;
      }

      const next = bloodTypeMap[key] ?? null;

      if (next === raw) {
        unchanged += 1;
        continue;
      }

      await prisma.servant.update({
        where: { id: servant.id },
        data: { bloodType: next },
      });

      if (next == null) {
        cleared += 1;
      } else {
        normalized += 1;
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`${normalized} normalized, ${cleared} cleared, ${unchanged} unchanged.`);

  if (unmapped.size > 0) {
    console.log("Unmapped values were left unchanged:");

    for (const [value, count] of unmapped) {
      console.log(`  ${JSON.stringify(value)} × ${count}`);
    }
  }
}

const entry = process.argv[1];

if (entry && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
  cleanBloodTypes().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Blood type cleanup failed: ${message}`);
    process.exitCode = 1;
  });
}
