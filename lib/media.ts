import type { MediaFileType } from "@/lib/cloudinary";

export type { MediaFileType };

export function mediaFileTypeLabel(type: string) {
  if (type === "pdf") return "ملف PDF";
  if (type === "word") return "ملف Word";
  return "صورة";
}

export function officePreviewUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

export function pdfEmbedUrl(fileUrl: string) {
  return `/api/media/preview?url=${encodeURIComponent(fileUrl)}`;
}

export function cloudinaryPdfPageImage(fileUrl: string) {
  if (!fileUrl.includes("res.cloudinary.com")) {
    return null;
  }

  if (fileUrl.includes("/raw/upload/")) {
    return fileUrl.replace(
      "/raw/upload/",
      "/image/upload/f_jpg,pg_1,q_auto,w_1400/",
    );
  }

  if (fileUrl.includes("/image/upload/")) {
    return fileUrl.replace(
      "/image/upload/",
      "/image/upload/f_jpg,pg_1,q_auto,w_1400/",
    );
  }

  return null;
}

export function mediaGalleryImage(item: {
  thumbnail?: string | null;
  fileUrl: string;
  fileType: string;
}) {
  if (item.thumbnail) {
    return item.thumbnail;
  }

  if (item.fileType === "image") {
    return item.fileUrl;
  }

  return cloudinaryPdfPageImage(item.fileUrl);
}

export function isCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function mediaDownloadFileName(
  fileName?: string | null,
  fileType?: string | null,
) {
  const extension =
    fileType === "pdf"
      ? ".pdf"
      : fileType === "word"
        ? ".docx"
        : fileType === "image"
          ? ".jpg"
          : "";

  const raw = (fileName || "file").replace(/[/\\?%*:|"<>]/g, " ").trim() || "file";
  const hasExtension = /\.(pdf|docx?|jpe?g|png|webp|gif)$/i.test(raw);

  return hasExtension ? raw : `${raw}${extension}`;
}

export function mediaDownloadUrl(
  fileUrl: string,
  fileName?: string | null,
  fileType?: string | null,
) {
  const params = new URLSearchParams({ url: fileUrl });

  if (fileName) {
    params.set("name", fileName);
  }

  if (fileType) {
    params.set("type", fileType);
  }

  return `/api/media/download?${params.toString()}`;
}
