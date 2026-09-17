import { Prisma } from "@prisma/client";

export const SERVANT_ROLE_VALUES = new Set(["AMEN", "NA2EB", "KHADEM"]);

export const SERVANT_ROLE_LABELS: Record<string, string> = {
  AMEN: "أمناء الخدمة",
  NA2EB: "نواب",
  KHADEM: "خدام",
};

export type ServantQueryFilters = {
  query?: string;
  roleType?: string;
  khedmaId?: string;
  unassignedOnly?: boolean;
};

export function parseServantListFilters(params: {
  q?: string | null;
  role?: string | null;
  khedma?: string | null;
}): ServantQueryFilters {
  const query = params.q?.trim() ?? "";
  const role = params.role?.trim() ?? "";
  const khedma = params.khedma?.trim() ?? "";
  const unassignedOnly = khedma === "unassigned";

  return {
    query: query || undefined,
    roleType: SERVANT_ROLE_VALUES.has(role) ? role : undefined,
    khedmaId: unassignedOnly ? undefined : khedma || undefined,
    unassignedOnly,
  };
}

export function servantListWhere(
  filters: ServantQueryFilters,
): Prisma.ServantWhereInput | undefined {
  const and: Prisma.ServantWhereInput[] = [];
  const query = filters.query?.trim() ?? "";
  const roleType = filters.roleType?.trim() || undefined;
  const khedmaId = filters.unassignedOnly ? undefined : filters.khedmaId?.trim() || undefined;
  const unassignedOnly = Boolean(filters.unassignedOnly);

  if (query) {
    and.push({
      OR: [{ name: { contains: query } }, { phone: { contains: query } }],
    });
  }

  if (unassignedOnly) {
    and.push({ assignments: { none: {} } });
  } else if (khedmaId || roleType) {
    and.push({
      assignments: {
        some: {
          category: {
            ...(khedmaId ? { khedmaId } : {}),
            ...(roleType ? { roleType } : {}),
          },
        },
      },
    });
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export function assignmentMatchesFilters(
  assignment: { category: { roleType: string; khedmaId: string } },
  filters: ServantQueryFilters,
) {
  if (filters.unassignedOnly) {
    return false;
  }

  if (filters.khedmaId && assignment.category.khedmaId !== filters.khedmaId) {
    return false;
  }

  if (filters.roleType && assignment.category.roleType !== filters.roleType) {
    return false;
  }

  return true;
}

export function uniqueJoin(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join("، ");
}
