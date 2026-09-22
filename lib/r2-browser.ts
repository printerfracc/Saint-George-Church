export type DirectUploadTarget = {
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
};

export async function uploadFileToR2(file: File, target: DirectUploadTarget) {
  const response = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": target.contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("فشل الرفع");
  }

  return target.publicUrl;
}
