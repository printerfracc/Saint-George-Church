import { NextResponse } from "next/server";
import { isCloudinaryUrl } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const fileUrl = new URL(request.url).searchParams.get("url");

  if (!fileUrl || !isCloudinaryUrl(fileUrl)) {
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
  }

  const response = await fetch(fileUrl);

  if (!response.ok) {
    return NextResponse.json({ error: "تعذر تحميل الملف" }, { status: 404 });
  }

  const bytes = await response.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="document.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
