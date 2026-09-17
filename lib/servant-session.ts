import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SERVANT_SESSION_COOKIE = "servant_session";
export const SERVANT_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type ServantSession = {
  servantId: string;
  name: string;
};

type SignedServantSession = ServantSession & {
  exp: number;
};

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  return secret;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function signServantSession(session: ServantSession) {
  const payload: SignedServantSession = {
    ...session,
    exp: Date.now() + SERVANT_SESSION_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(body).digest("base64url");

  return `${body}.${signature}`;
}

export function verifyServantSession(token: string): ServantSession | null {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const given = Buffer.from(signature);
  const valid = Buffer.from(expected);

  if (given.length !== valid.length || !timingSafeEqual(given, valid)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SignedServantSession;

    if (!payload.servantId || !payload.name || payload.exp < Date.now()) {
      return null;
    }

    return { servantId: payload.servantId, name: payload.name };
  } catch {
    return null;
  }
}

export async function getServantSession() {
  const token = (await cookies()).get(SERVANT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyServantSession(token);
  } catch {
    return null;
  }
}

export async function setServantSessionCookie(session: ServantSession) {
  (await cookies()).set(
    SERVANT_SESSION_COOKIE,
    signServantSession(session),
    cookieOptions(SERVANT_SESSION_MAX_AGE),
  );
}

export async function clearServantSessionCookie() {
  (await cookies()).set(SERVANT_SESSION_COOKIE, "", cookieOptions(0));
}
