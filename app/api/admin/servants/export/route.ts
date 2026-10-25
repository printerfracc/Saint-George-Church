import { NextRequest, NextResponse } from "next/server";
import { readServantContact } from "@/lib/crypto";
import { parseNationalId } from "@/lib/national-id";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { OTHER_KHEDMA_STATUS_ROLES } from "@/lib/servant-import-schema";
import {
  BIRTHDATE_EXPORT_LABEL,
  DEFAULT_SERVANT_EXPORT_FIELDS,
  SERVANT_EXPORT_FIELDS,
  birthdatePartValue,
  isBirthdateExportField,
  orderedServantExportFields,
  selectedBirthdateParts,
  servantExportLabel,
  type ServantExportField,
} from "@/lib/servant-export";
import { buildServantExportWorkbook, type ServantSheetColumn } from "@/lib/servant-export-sheet";
import {
  assignmentMatchesFilters,
  parseServantListFilters,
  serializeIdList,
  servantListWhere,
  servantMatchesSearchQuery,
  uniqueJoin,
  type ServantQueryFilters,
} from "@/lib/servant-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveExportFields(values: unknown) {
  if (values == null || values === "") {
    return [...DEFAULT_SERVANT_EXPORT_FIELDS];
  }

  return orderedServantExportFields(values);
}

type ExportAssignment = {
  khedma: { name: string } | null;
  role: { name: string } | null;
};

type SheetColumn = ServantSheetColumn & {
  value: (
    servant: {
      name: string;
      address: string | null;
      bloodType: string | null;
      graduationYear: string | null;
      jobOrStudy: string | null;
      previousKhedmas: string | null;
      deaconRank: string | null;
      extraNotes: string | null;
    },
    contact: { phone: string | null; nationalId: string | null },
    assignments: ExportAssignment[],
    dateOfBirth: Date | null,
  ) => string;
};

function exportColumns(fields: ServantExportField[]): SheetColumn[] {
  const columns: SheetColumn[] = [];
  let birthdateAdded = false;

  for (const field of fields) {
    if (isBirthdateExportField(field)) {
      if (!birthdateAdded) {
        for (const part of selectedBirthdateParts(fields)) {
          const source = SERVANT_EXPORT_FIELDS.find((field) => field.key === part.key);
          columns.push({
            header: part.label,
            groupTitle: BIRTHDATE_EXPORT_LABEL,
            width: source?.width ?? 12,
            kind: "number",
            value: (_servant, _contact, _assignments, dateOfBirth) =>
              birthdatePartValue(dateOfBirth, part.key),
          });
        }
        birthdateAdded = true;
      }
      continue;
    }

    const source = SERVANT_EXPORT_FIELDS.find((item) => item.key === field);
    columns.push({
      header: source?.label ?? servantExportLabel(field),
      groupTitle: null,
      width: source?.width ?? 20,
      kind: source?.kind === "id" || source?.kind === "number" ? source.kind : "text",
      value: (servant, contact, assignments) => exportCell(field, servant, contact, assignments),
    });
  }

  return columns;
}

function exportCell(
  field: Exclude<ServantExportField, "birthDay" | "birthMonth" | "birthYear">,
  servant: {
    name: string;
    address: string | null;
    bloodType: string | null;
    graduationYear: string | null;
    jobOrStudy: string | null;
    previousKhedmas: string | null;
    deaconRank: string | null;
    extraNotes: string | null;
  },
  contact: { phone: string | null; nationalId: string | null },
  assignments: ExportAssignment[],
) {
  switch (field) {
    case "name":
      return servant.name;
    case "nationalId":
      return contact.nationalId ?? "";
    case "phone":
      return contact.phone ?? "";
    case "address":
      return servant.address ?? "";
    case "bloodType":
      return servant.bloodType ?? "";
    case "deaconRank":
      return servant.deaconRank ?? "";
    case "graduationYear":
      return servant.graduationYear ?? "";
    case "jobOrStudy":
      return servant.jobOrStudy ?? "";
    case "khedma":
      return uniqueJoin(assignments.map((item) => item.khedma?.name ?? ""));
    case "role":
      return uniqueJoin(assignments.map((item) => item.role?.name ?? ""));
    case "previousKhedmas":
      return servant.previousKhedmas ?? "";
    case "notes":
      return servant.extraNotes ?? "";
  }
}

async function exportFilteredServants(filters: ServantQueryFilters, fields: ServantExportField[]) {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return NextResponse.json(
      { error: "غير مصرح لك بتنفيذ هذه العملية" },
      { status: 401 },
    );
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "حدد بيانات واحدة على الأقل" }, { status: 400 });
  }

  const statusRoles = filters.assignedToOtherKhedma
    ? await prisma.servantRole.findMany({
        where: { name: { in: OTHER_KHEDMA_STATUS_ROLES.map((role) => role.name) } },
        select: { id: true },
      })
    : [];
  const statusRoleIds = statusRoles
    .map((role) => role.id)
    .filter((roleId) => filters.roleIds.includes(roleId));
  const where = servantListWhere({
    ...filters,
    assignedToOtherKhedma: statusRoleIds.length > 0,
    statusRoleIds,
  });

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

    const columns = exportColumns(fields);
    const rows = servants.flatMap((servant) => {
      const contact = readServantContact(servant);

      if (!servantMatchesSearchQuery({ name: servant.name, ...contact }, filters.query)) {
        return [];
      }

      const assignments = servant.assignments.filter((assignment) =>
        assignmentMatchesFilters(assignment, filters),
      );
      const dateOfBirth = fields.some(isBirthdateExportField)
        ? parseNationalId(contact.nationalId ?? "").dateOfBirth
        : null;

      return [
        columns.map((column) => column.value(servant, contact, assignments, dateOfBirth)),
      ];
    });

    const buffer = await buildServantExportWorkbook(columns, rows);
    const suffix = [
      String(filters.year),
      serializeIdList(filters.roleIds),
      serializeIdList(filters.khedmaIds),
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
      { error: "تعذر تحميل الملف حالياً" },
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
      year: request.nextUrl.searchParams.get("year"),
      other: request.nextUrl.searchParams.get("other"),
      blood: request.nextUrl.searchParams.get("blood"),
      rank: request.nextUrl.searchParams.get("rank"),
    }),
    resolveExportFields(request.nextUrl.searchParams.get("fields")),
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    q?: string;
    role?: string;
    khedma?: string;
    year?: string;
    other?: string;
    blood?: string;
    rank?: string;
    fields?: unknown;
  } | null;

  return exportFilteredServants(
    parseServantListFilters({
      q: body?.q,
      role: body?.role,
      khedma: body?.khedma,
      year: body?.year,
      other: body?.other,
      blood: body?.blood,
      rank: body?.rank,
    }),
    resolveExportFields(body?.fields),
  );
}
