export function getAppUrl() {
  const fromAuth = process.env.NEXTAUTH_URL?.trim();
  const fromVercel = process.env.VERCEL_URL?.trim();

  const url =
    fromAuth ||
    (fromVercel ? `https://${fromVercel}` : "http://localhost:3000");

  return url.replace(/\/$/, "");
}

export function getInviteUrl(token: string) {
  return `${getAppUrl()}/admin/join?token=${token}`;
}
