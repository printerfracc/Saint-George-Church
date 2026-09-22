"use server";

import {
  detectMediaFileType,
  uploadImageToCloudinary,
  uploadLibraryFileToCloudinary,
  type CloudinaryUploadResult,
  type LibraryUploadResult,
} from "@/lib/cloudinary";
import {
  assembleLibraryFile,
  createLibraryUploadTarget,
  discardLibraryChunks,
  storeLibraryChunk,
  type DirectUploadTarget,
} from "@/lib/r2";
import { requireAdmin } from "@/lib/require-admin";

const UPLOAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CHUNK_BYTES = 3_500_000;
const MAX_LIBRARY_PARTS = 6;

export async function uploadMedia(
  formData: FormData,
): Promise<CloudinaryUploadResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "يرجى اختيار صورة للرفع" };
  }

  return uploadImageToCloudinary(file);
}

export async function uploadLibraryMedia(
  formData: FormData,
): Promise<LibraryUploadResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "يرجى اختيار ملف للرفع" };
  }

  return uploadLibraryFileToCloudinary(file);
}

export async function uploadLibraryChunk(
  formData: FormData,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const uploadId = String(formData.get("uploadId") ?? "");
  const index = Number(formData.get("index"));
  const total = Number(formData.get("total"));
  const chunk = formData.get("chunk");

  if (
    !UPLOAD_ID_PATTERN.test(uploadId) ||
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    index < 0 ||
    total < 1 ||
    total > MAX_LIBRARY_PARTS ||
    index >= total ||
    !(chunk instanceof File) ||
    chunk.size === 0 ||
    chunk.size > MAX_CHUNK_BYTES
  ) {
    return { success: false, error: "فشل رفع الملف" };
  }

  try {
    await storeLibraryChunk(uploadId, index, Buffer.from(await chunk.arrayBuffer()));
    return { success: true };
  } catch {
    return { success: false, error: "فشل الرفع" };
  }
}

export async function completeLibraryUpload(input: {
  uploadId: string;
  total: number;
  fileName: string;
  contentType: string;
}): Promise<LibraryUploadResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const uploadId = input.uploadId.trim();
  const fileName = input.fileName.trim();
  const total = input.total;

  if (
    !UPLOAD_ID_PATTERN.test(uploadId) ||
    !Number.isInteger(total) ||
    total < 1 ||
    total > MAX_LIBRARY_PARTS ||
    !fileName
  ) {
    return { success: false, error: "فشل رفع الملف" };
  }

  const fileType = detectMediaFileType(
    new File([], fileName, { type: input.contentType || "application/octet-stream" }),
  );

  if (!fileType || fileType === "link") {
    await discardLibraryChunks(uploadId, total).catch(() => undefined);
    return { success: false, error: "نوع الملف غير مدعوم" };
  }

  try {
    const url = await assembleLibraryFile(uploadId, total, fileName, input.contentType);

    return {
      success: true,
      url,
      fileName,
      fileType,
    };
  } catch {
    return { success: false, error: "فشل الرفع" };
  }
}

export async function abortLibraryUpload(uploadId: string, total: number) {
  const session = await requireAdmin();

  if (!session || !UPLOAD_ID_PATTERN.test(uploadId)) {
    return;
  }

  await discardLibraryChunks(uploadId, total).catch(() => undefined);
}

export async function getLibraryUploadSignature(
  fileName: string,
  contentType?: string,
): Promise<({ success: true } & DirectUploadTarget) | { success: false; error: string }> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  const trimmed = fileName.trim();

  if (!trimmed) {
    return { success: false, error: "يرجى اختيار ملف للرفع" };
  }

  try {
    return {
      success: true,
      ...(await createLibraryUploadTarget(trimmed, contentType)),
    };
  } catch {
    return { success: false, error: "فشل تجهيز رفع الملف" };
  }
}
