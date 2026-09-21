import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import {
  assignmentMatchesFilters,
  parseServantListFilters,
  serializeIdList,
  servantListWhere,
  uniqueJoin,
  type ServantQueryFilters,
} from "@/lib/servant-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADER_ROW = [
  "الاسم (Name)",
  "رقم الموبايل (Phone)",
  "الرقم القومي (NationalID)",
  "اسم الخدمة",
  "الرتبة",
];

async function exportFilteredServants(filters: ServantQueryFilters) {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return NextResponse.json(
      { error: "غير مصرح لك بتنفيذ هذه العملية" },
      { status: 401 },
    );
  }

  const where = servantListWhere(filters);

  try {
    const servants = await prisma.servant.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        assignments: {
          include: {
            khedma: true,
            role: true,
            category: {
              select: {
                khedmaId: true,
              },
            },
          },
        },
      },
    });

    const rows = servants.map((servant) => {
      const assignments = servant.assignments.filter((assignment) =>
        assignmentMatchesFilters(assignment, filters),
      );

      return {
        "الاسم (Name)": servant.name,
        "رقم الموبايل (Phone)": servant.phone ?? "",
        "الرقم القومي (NationalID)": servant.nationalId ?? "",
        "اسم الخدمة": uniqueJoin(assignments.map((item) => item.khedma?.name ?? "")),
        الرتبة: uniqueJoin(assignments.map((item) => item.role?.name ?? "")),
      };
    });

    const worksheet =
      rows.length > 0
        ? XLSX.utils.json_to_sheet(rows, { header: HEADER_ROW })
        : XLSX.utils.aoa_to_sheet([HEADER_ROW]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الخدام");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    const suffix = [
      serializeIdList(filters.roleIds),
      serializeIdList(filters.khedmaIds),
      filters.unassignedOnly ? "unassigned" : "",
      filters.query,
    ]
      .filter(Boolean)
      .join("-") || "all";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="khodam-export-${suffix}.xlsx"`,
        "Cache-Control": "no-store",
        "X-Export-Count": String(rows.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "تعذر تصدير بيانات الخدام حالياً" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return exportFilteredServants(
    parseServantListFilters({
      q: request.nextUrl.searchParams.get("q"),
      role: request.nextUrl.searchParams.get("role"),
      khedma: request.nextUrl.searchParams.get("khedma"),
    }),
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    q?: string;
    role?: string;
    khedma?: string;
  } | null;

  return exportFilteredServants(
    parseServantListFilters({
      q: body?.q,
      role: body?.role,
      khedma: body?.khedma,
    }),
  );
}
