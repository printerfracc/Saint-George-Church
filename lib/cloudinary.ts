const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_LIBRARY_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type MediaFileType = "image" | "pdf" | "word" | "link";

export type CloudinaryUploadResult =
  | { success: true; url: string }
  | { success: false; error: string };

export type LibraryUploadResult =
  | { success: true; url: string; fileName: string; fileType: MediaFileType }
  | { success: false; error: string };

const WORD_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "يرجى اختيار صورة للرفع";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "يُسمح برفع الصور فقط (JPG أو PNG أو WEBP أو GIF)";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "حجم الصورة أكبر من 10 ميغابايت";
  }

  return null;
}

export function detectMediaFileType(file: File): MediaFileType | null {
  const name = file.name.toLowerCase();

  if (ALLOWED_IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/.test(name)) {
    return "image";
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (WORD_TYPES.has(file.type) || /\.(docx?)$/.test(name)) {
    return "word";
  }

  return null;
}

export function validateLibraryFile(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "يرجى اختيار ملف للرفع";
  }

  if (!detectMediaFileType(file)) {
    return "يُسمح برفع الصور أو ملفات PDF أو Word فقط";
  }

  if (file.size > MAX_LIBRARY_FILE_SIZE_BYTES) {
    return "حجم الملف يتخطى 10 ميجابايت. يرجى ضغط الملف.";
  }

  return null;
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  const validationError = validateImageFile(file);

  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const { storeImageFile } = await import("@/lib/r2");
    return { success: true, url: await storeImageFile(file) };
  } catch {
    return { success: false, error: "فشل الرفع" };
  }
}

export async function uploadLibraryFileToCloudinary(
  file: File,
): Promise<LibraryUploadResult> {
  const validationError = validateLibraryFile(file);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const fileType = detectMediaFileType(file);

  if (!fileType) {
    return { success: false, error: "نوع الملف غير مدعوم" };
  }

  try {
    const { storeLibraryFile } = await import("@/lib/r2");
    return {
      success: true,
      url: await storeLibraryFile(file),
      fileName: file.name,
      fileType,
    };
  } catch {
    return { success: false, error: "فشل الرفع" };
  }
}
