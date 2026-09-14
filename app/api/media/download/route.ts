import { NextResponse } from "next/server";
import {
  isCloudinaryUrl,
  mediaDownloadFileName,
} from "@/lib/media";

export const runtime = "nodejs";

function contentTypeFor(fileType: string | null, fallback: string | null) {
  if (fileType === "pdf") return "application/pdf";
  if (fileType === "word") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (fileType === "image") return fallback || "image/jpeg";
  return fallback || "application/octet-stream";
}

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_") || "file";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const fileUrl = search.get("url");
  const fileName = search.get("name");
  const fileType = search.get("type");

  if (!fileUrl || !isCloudinaryUrl(fileUrl)) {
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
  }

  const response = await fetch(fileUrl);

  if (!response.ok) {
    return NextResponse.json({ error: "تعذر تحميل الملف" }, { status: 404 });
  }

  const bytes = await response.arrayBuffer();
  const downloadName = mediaDownloadFileName(fileName, fileType);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(fileType, response.headers.get("content-type")),
      "Content-Disposition": contentDisposition(downloadName),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
