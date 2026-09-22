"use server";

import {
  uploadImageToCloudinary,
  uploadLibraryFileToCloudinary,
  type CloudinaryUploadResult,
  type LibraryUploadResult,
} from "@/lib/cloudinary";
import { createLibraryUploadTarget, type DirectUploadTarget } from "@/lib/r2";
import { requireAdmin } from "@/lib/require-admin";

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
