function withProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function normalizeOrigin(value: string) {
  const normalized = withProtocol(value.trim()).replace(/\/$/, "");

  try {
    return new URL(normalized).origin;
  } catch {
    return "";
  }
}

export function getAppUrl() {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fromAuth = process.env.NEXTAUTH_URL?.trim();
  const fromVercel = process.env.VERCEL_URL?.trim();
  const raw = fromPublic || fromAuth || fromVercel || "http://localhost:3001";

  return normalizeOrigin(raw) || "http://localhost:3001";
}

export function buildInviteUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/admin/join?token=${encodeURIComponent(token)}`;
}

export function getInviteUrl(token: string, origin = getAppUrl()) {
  return buildInviteUrl(origin, token);
}
