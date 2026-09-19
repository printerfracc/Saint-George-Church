export type BrowserUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  fileName: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export async function uploadLibraryFileFromBrowser(
  file: File,
  signed: BrowserUploadSignature,
) {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);
  body.append("folder", signed.folder);
  body.append("use_filename", "true");
  body.append("unique_filename", "true");
  body.append("filename_override", signed.fileName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`,
    {
      method: "POST",
      body,
    },
  );

  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "فشل الرفع");
  }

  return data.secure_url;
}
