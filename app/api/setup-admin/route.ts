import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  try {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return NextResponse.json({ message: "Super Admin already exists." });
    }

    const hashedPassword = await hash("admin123", 12);

    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@church.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    return NextResponse.json({
      message: "Super Admin created successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        message: "Failed to initialize Super Admin.",
      },
      { status: 500 },
    );
  }
}
