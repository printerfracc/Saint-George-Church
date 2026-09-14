import { NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "يجب تسجيل الدخول للمتابعة" },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "يرجى اختيار صورة للرفع" },
      { status: 400 },
    );
  }

  const result = await uploadImageToCloudinary(file);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
