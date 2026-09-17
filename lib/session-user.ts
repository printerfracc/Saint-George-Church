import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

type SessionUserRecord = {
  id: string;
  email: string;
  role: Role;
  name: string;
};

const userSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
} as const;

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function describeAuthId(value?: string | null) {
  const id = value?.trim() ?? "";

  return {
    length: id.length,
    prefix: id.slice(0, 4),
    looksLikeCuid: /^c[a-z0-9]{20,}$/i.test(id),
    looksLikeUuid:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      ),
    looksLikeEmail: id.includes("@"),
  };
}

export async function findUserByIdOrEmail(
  id?: string | null,
  email?: string | null,
) {
  const sessionId = id?.trim() ?? "";
  const rawEmail = email?.trim() ?? "";
  const normalizedEmail = normalizeEmail(email);

  if (sessionId) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionId },
      select: userSelect,
    });

    if (byId) {
      return byId;
    }
  }

  if (rawEmail) {
    const byRawEmail = await prisma.user.findUnique({
      where: { email: rawEmail },
      select: userSelect,
    });

    if (byRawEmail) {
      return byRawEmail;
    }
  }

  if (normalizedEmail && normalizedEmail !== rawEmail) {
    const byNormalizedEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: userSelect,
    });

    if (byNormalizedEmail) {
      return byNormalizedEmail;
    }
  }

  if (normalizedEmail) {
    const users = await prisma.user.findMany({ select: userSelect });
    const byCaseInsensitiveEmail = users.find(
      (user) => normalizeEmail(user.email) === normalizedEmail,
    );

    if (byCaseInsensitiveEmail) {
      return byCaseInsensitiveEmail;
    }
  }

  return null;
}

export async function resolveSessionUser(
  session: Session | null | undefined,
): Promise<SessionUserRecord | null> {
  if (!session?.user) {
    console.info("[auth] resolveSessionUser: no session user");
    return null;
  }

  const user = await findUserByIdOrEmail(session.user.id, session.user.email);

  console.info("[auth] resolveSessionUser", {
    sessionId: describeAuthId(session.user.id),
    hasEmail: Boolean(session.user.email),
    emailLength: session.user.email?.length ?? 0,
    emailHasAt: Boolean(session.user.email?.includes("@")),
    sessionRole: session.user.role,
    found: Boolean(user),
    dbRole: user?.role ?? null,
    idMatch: Boolean(user && user.id === session.user.id),
  });

  return user;
}

export async function resolveSuperAdmin(session: Session | null | undefined) {
  const user = await resolveSessionUser(session);

  if (user?.role === "SUPER_ADMIN") {
    return user;
  }

  if (session?.user.role !== "SUPER_ADMIN") {
    return null;
  }

  const fallback = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: userSelect,
  });

  console.info("[auth] resolveSuperAdmin: stale session, using fallback creator", {
    found: Boolean(fallback),
    fallbackId: fallback ? describeAuthId(fallback.id) : null,
  });

  return fallback;
}
