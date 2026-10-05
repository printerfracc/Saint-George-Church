import { NextResponse } from "next/server";
import { SERVANT_SESSION_COOKIE } from "@/lib/servant-session";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/tawze3a/login", request.url));

  response.cookies.set(SERVANT_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
