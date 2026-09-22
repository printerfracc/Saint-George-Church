import { NextResponse } from "next/server";
import {
  fetchCloudinaryAsset,
  isAllowedCloudinaryUrl,
  normalizeMediaFileUrl,
} from "@/lib/cloudinary-asset";
import { mediaDownloadFileName } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 60;

function contentTypeFor(
  fileType: string | null,
  fallback: string | null,
  fileUrl: string,
) {
  if (fileType === "pdf" || fileUrl.toLowerCase().includes(".pdf")) {
    return "application/pdf";
  }

  if (fileType === "word" || /\.docx?$/i.test(fileUrl)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (fileType === "image") {
    return fallback || "image/jpeg";
  }

  return fallback || "application/octet-stream";
}

function inlineDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_") || "document";
  const encoded = encodeURIComponent(fileName);
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const rawUrl = search.get("url");
  const fileUrl = rawUrl ? normalizeMediaFileUrl(rawUrl) : null;
  const fileType = search.get("type");
  const fileName = search.get("name");

  if (!fileUrl || !isAllowedCloudinaryUrl(fileUrl)) {
    return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
  }

  const response = await fetchCloudinaryAsset(fileUrl);

  if (!response?.ok || !response.body) {
    return NextResponse.json({ error: "تعذر فتح الملف" }, { status: 404 });
  }

  const downloadName = mediaDownloadFileName(fileName, fileType);

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentTypeFor(
        fileType,
        response.headers.get("content-type"),
        fileUrl,
      ),
      "Content-Disposition": inlineDisposition(downloadName),
      "Cache-Control": "private, max-age=300",
    },
  });
}
