import { NextResponse } from "next/server";
import {
  fetchCloudinaryAsset,
  isAllowedCloudinaryUrl,
  normalizeMediaFileUrl,
} from "@/lib/cloudinary-asset";
import { GALLERY_MEDIA_IMAGE } from "@/lib/eed-constants";
import { prisma } from "@/lib/prisma";
import { getServantSession } from "@/lib/servant-session";

export const runtime = "nodejs";
export const maxDuration = 60;

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_") || "photo.jpg";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function fileNameFromUrl(url: string, id: string) {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "");
    if (last && !last.includes("..") && last.length <= 180) {
      return last;
    }
  } catch {
    // Fall back to a stable photo name.
  }

  return `photo-${id}.jpg`;
}

export async function GET(request: Request) {
  const publishedTawze3a = await prisma.tawze3a.findFirst({
    where: { isPublished: true },
    select: { id: true },
  });

  if (!publishedTawze3a) {
    return NextResponse.json({ error: "غير متاح" }, { status: 404 });
  }

  const session = await getServantSession();

  if (!session) {
    return NextResponse.redirect(new URL("/tawze3a/login?next=/tawze3a/gallery", request.url));
  }

  const servant = await prisma.servant.findUnique({
    where: { id: session.servantId },
    select: { id: true },
  });

  if (!servant) {
    return NextResponse.redirect(new URL("/tawze3a/clear-session", request.url));
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 400 });
  }

  const item = await prisma.galleryMedia.findUnique({
    where: { id },
    select: { id: true, type: true, url: true },
  });
  const fileUrl = item?.url ? normalizeMediaFileUrl(item.url) : null;

  if (!item || item.type !== GALLERY_MEDIA_IMAGE || !fileUrl || !isAllowedCloudinaryUrl(fileUrl)) {
    return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 });
  }

  const response = await fetchCloudinaryAsset(fileUrl);

  if (!response?.ok || !response.body) {
    return NextResponse.json({ error: "تعذر تحميل الصورة" }, { status: 404 });
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("content-type") || "image/jpeg",
      "Content-Disposition": contentDisposition(fileNameFromUrl(fileUrl, item.id)),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
