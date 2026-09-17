import { headers } from "next/headers";
import { getAppUrl, getInviteUrl } from "@/lib/app-url";

export async function getRequestAppUrl() {
  try {
    const requestHeaders = await headers();
    const host = (
      requestHeaders.get("x-forwarded-host") ||
      requestHeaders.get("host") ||
      ""
    )
      .split(",")[0]
      .trim();

    if (!host) {
      return getAppUrl();
    }

    const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();
    const protocol =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");

    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return getAppUrl();
  }
}

export async function getRequestInviteUrl(token: string) {
  return getInviteUrl(token, await getRequestAppUrl());
}
