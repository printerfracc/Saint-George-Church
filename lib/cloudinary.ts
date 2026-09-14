import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type MediaFileType = "image" | "pdf" | "word";

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

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("إعدادات Cloudinary غير مكتملة");
  }
}

export function validateImageFile(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "يرجى اختيار صورة للرفع";
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "يُسمح برفع الصور فقط (JPG أو PNG أو WEBP أو GIF)";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
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

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "حجم الملف أكبر من 10 ميغابايت";
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
    assertCloudinaryConfig();

    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "saint-george-church",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error ?? new Error("فشل الرفع"));
              return;
            }

            resolve(result.secure_url);
          },
        )
        .end(buffer);
    });

    return { success: true, url };
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
    assertCloudinaryConfig();

    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "saint-george-church/library",
            resource_type: fileType === "word" ? "raw" : "image",
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error ?? new Error("فشل الرفع"));
              return;
            }

            resolve(result.secure_url);
          },
        )
        .end(buffer);
    });

    return {
      success: true,
      url,
      fileName: file.name,
      fileType,
    };
  } catch {
    return { success: false, error: "فشل الرفع" };
  }
}

export { cloudinary };
