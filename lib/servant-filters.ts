import { Prisma } from "@prisma/client";

export const UNASSIGNED_KHEDMA_VALUE = "unassigned";

export type ServantQueryFilters = {
  query?: string;
  roleIds: string[];
  khedmaIds: string[];
  unassignedOnly?: boolean;
};

export function parseIdList(value?: string | string[] | null): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function serializeIdList(ids: string[]): string {
  return [...new Set(ids.map((item) => item.trim()).filter(Boolean))].join(",");
}

export function parseServantListFilters(params: {
  q?: string | string[] | null;
  role?: string | string[] | null;
  khedma?: string | string[] | null;
}): ServantQueryFilters {
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const roleIds = parseIdList(params.role);
  const khedmaValues = parseIdList(params.khedma);
  const unassignedOnly = khedmaValues.includes(UNASSIGNED_KHEDMA_VALUE);
  const khedmaIds = khedmaValues.filter((id) => id !== UNASSIGNED_KHEDMA_VALUE);

  return {
    query: query || undefined,
    roleIds,
    khedmaIds,
    unassignedOnly,
  };
}

export function servantListWhere(
  filters: ServantQueryFilters,
): Prisma.ServantWhereInput | undefined {
  const and: Prisma.ServantWhereInput[] = [];
  const query = filters.query?.trim() ?? "";
  const roleIds = (filters.roleIds ?? []).filter(Boolean);
  const khedmaIds = (filters.khedmaIds ?? []).filter(Boolean);
  const unassignedOnly = Boolean(filters.unassignedOnly);
  const hasRole = roleIds.length > 0;
  const hasKhedma = khedmaIds.length > 0;

  if (query) {
    and.push({
      OR: [{ name: { contains: query } }, { phone: { contains: query } }],
    });
  }

  if (unassignedOnly && !hasKhedma) {
    and.push({ assignments: { none: {} } });
  } else if (unassignedOnly && hasKhedma) {
    and.push({
      OR: [
        { assignments: { none: {} } },
        { assignments: { some: { khedmaId: { in: khedmaIds } } } },
      ],
    });
  } else if (hasKhedma) {
    and.push({ assignments: { some: { khedmaId: { in: khedmaIds } } } });
  }

  if (hasRole) {
    and.push({ assignments: { some: { roleId: { in: roleIds } } } });
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export function assignmentMatchesFilters(
  assignment: { roleId: string; khedmaId?: string | null; category?: { khedmaId: string } },
  filters: ServantQueryFilters,
) {
  if (filters.unassignedOnly && filters.khedmaIds.length === 0) {
    return false;
  }

  const assignmentKhedmaId = assignment.khedmaId ?? assignment.category?.khedmaId;

  if (filters.khedmaIds.length > 0 && (!assignmentKhedmaId || !filters.khedmaIds.includes(assignmentKhedmaId))) {
    return false;
  }

  if (filters.roleIds.length > 0 && !filters.roleIds.includes(assignment.roleId)) {
    return false;
  }

  return true;
}

export function servantMatchesFilters(
  servant: {
    assignments: Array<{ roleId: string; khedmaId?: string | null }>;
  },
  selectedRoles: string[],
  selectedKhedmat: string[],
) {
  const khedmaIds = selectedKhedmat.filter((id) => id !== UNASSIGNED_KHEDMA_VALUE);
  const includeUnassigned = selectedKhedmat.includes(UNASSIGNED_KHEDMA_VALUE);

  const matchesKhedma =
    selectedKhedmat.length === 0 ||
    (includeUnassigned && servant.assignments.length === 0) ||
    servant.assignments.some((assignment) => khedmaIds.includes(assignment.khedmaId ?? ""));

  const matchesRole =
    selectedRoles.length === 0 ||
    servant.assignments.some((assignment) => selectedRoles.includes(assignment.roleId));

  return matchesKhedma && matchesRole;
}

export function uniqueJoin(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join("، ");
}
