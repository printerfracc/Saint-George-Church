import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const clientGeneration = "khedma-logo-url-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaGeneration?: string;
};

function createPrismaClient() {
  const adapter = new PrismaTiDBCloud({ url: connectionString });
  return new PrismaClient({ adapter });
}

type RequiredPrismaModel =
  | "dynamicContent"
  | "relic"
  | "churchActivity"
  | "liturgyEntry"
  | "prayerRequest"
  | "servant"
  | "servantRole"
  | "tawze3a"
  | "siteContent"
  | "galleryMedia";

function hasModel(client: PrismaClient, key: RequiredPrismaModel) {
  try {
    const models = client as PrismaClient &
      Record<RequiredPrismaModel, { findMany?: unknown } | undefined>;
    return typeof models[key]?.findMany === "function";
  } catch {
    return false;
  }
}

function isCurrentClient(client?: PrismaClient) {
  return Boolean(
    client &&
      hasModel(client, "dynamicContent") &&
      hasModel(client, "relic") &&
      hasModel(client, "churchActivity") &&
      hasModel(client, "liturgyEntry") &&
      hasModel(client, "prayerRequest") &&
      hasModel(client, "servant") &&
      hasModel(client, "servantRole") &&
      hasModel(client, "tawze3a") &&
      hasModel(client, "siteContent") &&
      hasModel(client, "galleryMedia"),
  );
}

function getPrismaClient() {
  if (
    globalForPrisma.prismaGeneration === clientGeneration &&
    isCurrentClient(globalForPrisma.prisma)
  ) {
    return globalForPrisma.prisma as PrismaClient;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaGeneration = clientGeneration;
  }

  return client;
}

export const prisma = getPrismaClient();
