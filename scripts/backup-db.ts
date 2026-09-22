// Run the backup with: npx tsx scripts/backup-db.ts

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import type { PrismaClient } from "@prisma/client";

dotenv.config();

type FindManyDelegate = {
  findMany: () => Promise<unknown[]>;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function serialize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serialize(entry)]),
    );
  }

  return value;
}

async function modelNames() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const schema = await readFile(schemaPath, "utf8");
  return [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);
}

function clientKey(modelName: string) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function findManyDelegate(client: PrismaClient, modelName: string): FindManyDelegate {
  const key = clientKey(modelName);
  const delegate = client[key as keyof PrismaClient];

  if (
    !delegate ||
    typeof delegate !== "object" ||
    !("findMany" in delegate) ||
    typeof delegate.findMany !== "function"
  ) {
    throw new Error(`Prisma Client has no findMany delegate for ${modelName}`);
  }

  return delegate as FindManyDelegate;
}

async function backupDatabase() {
  requiredEnv("DATABASE_URL");

  const { prisma } = await import("../lib/prisma");
  const names = await modelNames();
  const models: Record<string, unknown[]> = {};
  let total = 0;

  try {
    for (const modelName of names) {
      const records = await findManyDelegate(prisma, modelName).findMany();
      models[modelName] = serialize(records) as unknown[];
      total += records.length;
      console.log(`${modelName}: ${records.length}`);
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      total,
      models,
    };
    const outputPath = path.join(process.cwd(), "database-backup.json");
    await writeFile(outputPath, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

    console.log(`Backup saved to ${outputPath}`);
    console.log(`Backed up ${total} records.`);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Backup failed: ${message}`);
  process.exitCode = 1;
});
