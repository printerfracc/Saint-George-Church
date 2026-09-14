function withProtocol(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getAppUrl() {
  const fromAuth = process.env.NEXTAUTH_URL?.trim();
  const fromVercel = process.env.VERCEL_URL?.trim();
  const raw = fromAuth || fromVercel || "http://localhost:3000";
  const normalized = withProtocol(raw).replace(/\/$/, "");

  try {
    return new URL(normalized).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function getInviteUrl(token: string) {
  return `${getAppUrl()}/admin/join?token=${token}`;
}
