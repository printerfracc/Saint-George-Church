"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  clearServantStatusRole,
  createServant,
  deleteAllServants,
  deleteServant,
  updateServant,
  uploadServantPhoto,
  type ServantRecord,
} from "@/actions/servants-crud";
import ImageUpload from "@/components/admin/ImageUpload";
import { DraftBadge } from "@/components/admin/AssignmentYearTools";
import MultiSelectFilter from "@/components/admin/MultiSelectFilter";
import { OTHER_KHEDMA_STATUS_ROLES } from "@/lib/servant-import-schema";
import type { ServantRoleOption } from "@/lib/servant-roles";
import { serializeIdList, servantMatchesFilters } from "@/lib/servant-filters";
import {
  AdminEmptyState,
  AdminMobileCard,
  AdminResponsiveTable,
  adminActionDanger,
  adminActionGold,
  adminActionMuted,
  adminActionOutline,
} from "@/components/admin/admin-ui";

export type ServantRow = Omit<ServantRecord, "createdAt"> & {
  createdAt: string;
};

export type KhedmaFilterOption = {
  id: string;
  name: string;
  tawze3aTitle: string;
};

function maskNationalId(value?: string | null) {
  const nationalId = value?.trim() ?? "";

  if (!nationalId) {
    return "غير مسجل";
  }

  if (nationalId.length <= 4) {
    return "••••";
  }

  return `${"•".repeat(nationalId.length - 4)}${nationalId.slice(-4)}`;
}

function displayPhone(value?: string | null) {
  const phone = value?.trim() ?? "";
  return phone || "غير مسجل";
}

function formatAddedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function uniqueLabels(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))];
}

function LabelChips({ labels, emptyLabel }: { labels: string[]; emptyLabel: string }) {
  if (labels.length === 0) {
    return <span className="text-gray-400">{emptyLabel}</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          key={label}
          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
        >
          {label}
        </span>
      ))}
    </span>
  );
}

type ServantFormState = {
  name: string;
  phone: string;
  nationalId: string;
  address: string;
  bloodType: string;
  emergencyContact: string;
  graduationYear: string;
  jobOrStudy: string;
  previousKhedmas: string;
  deaconRank: string;
  extraNotes: string;
  photoUrl: string;
};

const emptyForm: ServantFormState = {
  name: "",
  phone: "",
  nationalId: "",
  address: "",
  bloodType: "",
  emergencyContact: "",
  graduationYear: "",
  jobOrStudy: "",
  previousKhedmas: "",
  deaconRank: "",
  extraNotes: "",
  photoUrl: "",
};

const fieldClass =
  "w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold";

const PROFILE_DETAILS = [
  ["address", "العنوان"],
  ["bloodType", "فصيلة الدم"],
  ["emergencyContact", "طوارئ"],
  ["graduationYear", "سنة التخرج"],
  ["jobOrStudy", "المهنة/الدراسة"],
  ["deaconRank", "الرتبة الشماسية"],
  ["previousKhedmas", "خدمات سابقة"],
  ["extraNotes", "ملاحظات"],
] as const;

function filledText(value?: string | null) {
  const text = value?.trim() ?? "";
  return text || "غير مسجل";
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function formFromServant(servant: ServantRow): ServantFormState {
  return {
    name: servant.name,
    phone: servant.phone ?? "",
    nationalId: servant.nationalId ?? "",
    address: servant.address ?? "",
    bloodType: servant.bloodType ?? "",
    emergencyContact: servant.emergencyContact ?? "",
    graduationYear: servant.graduationYear ?? "",
    jobOrStudy: servant.jobOrStudy ?? "",
    previousKhedmas: servant.previousKhedmas ?? "",
    deaconRank: servant.deaconRank ?? "",
    extraNotes: servant.extraNotes ?? "",
    photoUrl: servant.photoUrl ?? "",
  };
}

function servantPhotoUrl(photoUrl?: string | null) {
  const url = photoUrl?.trim() ?? "";
  return url && isHttpUrl(url) ? url : "";
}

function ServantPhoto({
  name,
  photoUrl,
  size = "list",
  onOpen,
}: {
  name: string;
  photoUrl?: string | null;
  size?: "list" | "details";
  onOpen: (src: string, name: string) => void;
}) {
  const src = servantPhotoUrl(photoUrl);

  if (!src) {
    return null;
  }

  const frame =
    size === "details"
      ? "size-20 border-2"
      : "size-10 border";

  return (
    <button
      type="button"
      onClick={() => onOpen(src, name)}
      className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={`عرض صورة ${name}`}
    >
      <img
        src={src}
        alt=""
        className={`${frame} rounded-full border-coptic-gold-main object-cover`}
      />
    </button>
  );
}

function ProfileDetails({ servant }: { servant: ServantRow }) {
  return (
    <dl className="mt-4 space-y-3">
      {PROFILE_DETAILS.map(([key, label]) => (
        <div key={key} className="rounded-xl bg-white/80 px-3 py-2">
          <dt className="text-xs font-bold text-coptic-gold-dark">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-deep-red">
            {filledText(servant[key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function KhedmaChips({ assignments }: { assignments: ServantRow["assignments"] }) {
  const groups = new Map<string, { name: string; roles: string[]; isDraft: boolean }>();

  for (const assignment of assignments) {
    if (!assignment.khedmaName) {
      continue;
    }

    const key = assignment.khedmaId || assignment.khedmaName;
    const current = groups.get(key) ?? {
      name: assignment.khedmaName,
      roles: [],
      isDraft: false,
    };

    if (assignment.roleName && !current.roles.includes(assignment.roleName)) {
      current.roles.push(assignment.roleName);
    }

    current.isDraft = current.isDraft || assignment.isDraft;
    groups.set(key, current);
  }

  const items = [...groups.entries()];

  if (items.length === 0) {
    return <span className="text-gray-400">غير مسند</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {items.map(([key, item]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
        >
          {item.name}
          {item.roles.length > 0 ? ` — ${item.roles.join("، ")}` : ""}
          {item.isDraft ? <DraftBadge /> : null}
        </span>
      ))}
    </span>
  );
}

export default function ServantDirectory({
  initialServants,
  initialTotal,
  khedmat,
  roles,
  query,
  roleIds,
  khedmaIds,
  bloodType,
  deaconRank,
  bloodTypes,
  deaconRanks,
  selectedYear,
  assignedToOtherKhedma,
}: {
  initialServants: ServantRow[];
  initialTotal: number;
  khedmat: KhedmaFilterOption[];
  roles: ServantRoleOption[];
  query: string;
  roleIds: string[];
  khedmaIds: string[];
  bloodType: string;
  deaconRank: string;
  bloodTypes: string[];
  deaconRanks: string[];
  selectedYear: number;
  assignedToOtherKhedma: boolean;
}) {
  const router = useRouter();
  const [servants, setServants] = useState(initialServants);
  const [total, setTotal] = useState(initialTotal);
  const [searchInput, setSearchInput] = useState(query);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(roleIds);
  const [selectedKhedmat, setSelectedKhedmat] = useState<string[]>(khedmaIds);
  const [selectedBloodType, setSelectedBloodType] = useState(bloodType);
  const [selectedDeaconRank, setSelectedDeaconRank] = useState(deaconRank);
  const [otherKhedmaOnly, setOtherKhedmaOnly] = useState(assignedToOtherKhedma);
  const [details, setDetails] = useState<ServantRow | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{ src: string; name: string } | null>(null);
  const [clearingId, setClearingId] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<ServantFormState>(emptyForm);
  const [editing, setEditing] = useState<ServantRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ServantRow | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const skipFilterSync = useRef(false);
  const isComposing = useRef(false);
  const incomingRoleKey = serializeIdList(roleIds);
  const incomingKhedmaKey = serializeIdList(khedmaIds);

  useEffect(() => {
    setServants(initialServants);
    setTotal(initialTotal);
  }, [initialServants, initialTotal]);

  useEffect(() => {
    if (!photoPreview) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPhotoPreview(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [photoPreview]);

  useEffect(() => {
    if (skipFilterSync.current) {
      skipFilterSync.current = false;
      return;
    }

    setSelectedRoles(roleIds);
    setSelectedKhedmat(khedmaIds);
    setSelectedBloodType(bloodType);
    setSelectedDeaconRank(deaconRank);
    setOtherKhedmaOnly(assignedToOtherKhedma);
  }, [assignedToOtherKhedma, bloodType, deaconRank, incomingKhedmaKey, incomingRoleKey, khedmaIds, roleIds]);

  const statusRoleIds = useMemo(
    () =>
      roles
        .filter((role) => OTHER_KHEDMA_STATUS_ROLES.some((status) => status.name === role.name))
        .map((role) => role.id),
    [roles],
  );
  const showOtherKhedmaToggle = statusRoleIds.some((roleId) => selectedRoles.includes(roleId));

  const roleOptions = useMemo(
    () => roles.map((item) => ({ id: item.id, label: item.name })),
    [roles],
  );

  const khedmaOptions = useMemo(
    () =>
      khedmat.map((item) => ({
        id: item.id,
        label: item.tawze3aTitle ? `${item.name} — ${item.tawze3aTitle}` : item.name,
      })),
    [khedmat],
  );

  const visibleServants = useMemo(
    () =>
      servants.filter((servant) =>
        servantMatchesFilters(
          servant,
          selectedRoles,
          selectedKhedmat,
          selectedBloodType,
          selectedDeaconRank,
        ),
      ),
    [selectedBloodType, selectedDeaconRank, selectedKhedmat, selectedRoles, servants],
  );

  useEffect(() => {
    if (isComposing.current) {
      return;
    }

    const handle = window.setTimeout(() => {
      if (isComposing.current) {
        return;
      }

      const nextQuery = searchInput.trim();

      if (nextQuery === query) {
        return;
      }

      replaceFilters({ q: nextQuery });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [otherKhedmaOnly, searchInput, query, selectedBloodType, selectedDeaconRank, selectedRoles, selectedKhedmat]);

  const title = useMemo(
    () => (editing ? "تعديل خادم" : "إضافة خادم"),
    [editing],
  );

  function replaceFilters(next: {
    q?: string;
    roleIds?: string[];
    khedmaIds?: string[];
    assignedToOtherKhedma?: boolean;
    bloodType?: string;
    deaconRank?: string;
  }) {
    const params = new URLSearchParams();
    const nextQuery = "q" in next ? next.q ?? "" : query;
    const nextRoles = "roleIds" in next ? next.roleIds ?? [] : selectedRoles;
    const nextKhedmat = "khedmaIds" in next ? next.khedmaIds ?? [] : selectedKhedmat;
    const nextBlood = "bloodType" in next ? next.bloodType ?? "" : selectedBloodType;
    const nextRank = "deaconRank" in next ? next.deaconRank ?? "" : selectedDeaconRank;
    const nextOther =
      "assignedToOtherKhedma" in next ? Boolean(next.assignedToOtherKhedma) : otherKhedmaOnly;
    const nextRole = serializeIdList(nextRoles);
    const nextKhedma = serializeIdList(nextKhedmat);
    const keepOther = Boolean(
      nextOther && nextRoles.some((roleId) => statusRoleIds.includes(roleId)),
    );

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (nextRole) {
      params.set("role", nextRole);
    }

    if (nextKhedma) {
      params.set("khedma", nextKhedma);
    }

    if (nextBlood) {
      params.set("blood", nextBlood);
    }

    if (nextRank) {
      params.set("rank", nextRank);
    }

    if (keepOther) {
      params.set("other", "1");
    }

    const qs = params.toString().replaceAll("+", "%20");
    router.replace(qs ? `/admin/servants?${qs}` : "/admin/servants", { scroll: false });
  }

  function handleRolesChange(ids: string[]) {
    skipFilterSync.current = true;
    setSelectedRoles(ids);
    const keepOther = Boolean(
      otherKhedmaOnly && ids.some((roleId) => statusRoleIds.includes(roleId)),
    );
    setOtherKhedmaOnly(keepOther);
    replaceFilters({ roleIds: ids, assignedToOtherKhedma: keepOther });
  }

  function handleOtherKhedmaChange(checked: boolean) {
    skipFilterSync.current = true;
    setOtherKhedmaOnly(checked);
    replaceFilters({ assignedToOtherKhedma: checked });
  }

  function handleKhedmatChange(ids: string[]) {
    skipFilterSync.current = true;
    setSelectedKhedmat(ids);
    replaceFilters({ khedmaIds: ids });
  }

  function handleBloodTypeChange(value: string) {
    skipFilterSync.current = true;
    setSelectedBloodType(value);
    replaceFilters({ bloodType: value });
  }

  function handleDeaconRankChange(value: string) {
    skipFilterSync.current = true;
    setSelectedDeaconRank(value);
    replaceFilters({ deaconRank: value });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEdit(servant: ServantRow) {
    setDetails(null);
    setEditing(servant);
    setForm(formFromServant(servant));
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload = {
      name: form.name,
      phone: form.phone,
      nationalId: form.nationalId,
      address: form.address,
      bloodType: form.bloodType,
      emergencyContact: form.emergencyContact,
      graduationYear: form.graduationYear,
      jobOrStudy: form.jobOrStudy,
      previousKhedmas: form.previousKhedmas,
      deaconRank: form.deaconRank,
      extraNotes: form.extraNotes,
      photoUrl: form.photoUrl,
    };

    const result = editing
      ? await updateServant(editing.id, payload)
      : await createServant(payload);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    closeForm();
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }

    const result = await deleteServant(deleting.id);

    if ("error" in result) {
      setError(result.error);
      setDeleting(null);
      return;
    }

    setDeleting(null);
    setServants((current) => current.filter((servant) => servant.id !== deleting.id));
    setTotal((current) => Math.max(0, current - 1));
    router.refresh();
  }

  async function confirmDeleteAll() {
    setIsDeletingAll(true);
    setError("");

    const result = await deleteAllServants();
    setIsDeletingAll(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setShowDeleteAll(false);
    setServants([]);
    setTotal(0);
    router.refresh();
  }

  function statusRolesToClear(servant: ServantRow) {
    const inYear = servant.assignments.filter((assignment) => assignment.year === selectedYear);
    const realKhedma = inYear.some((assignment) => Boolean(assignment.khedmaId));

    if (!realKhedma) {
      return [];
    }

    return OTHER_KHEDMA_STATUS_ROLES.filter((status) =>
      inYear.some((assignment) => assignment.roleName === status.name && !assignment.khedmaId),
    );
  }

  function matchesOtherKhedmaFilter(servant: ServantRow) {
    const inYear = servant.assignments.filter((assignment) => assignment.year === selectedYear);
    const selectedStatusNames = new Set(
      roles
        .filter(
          (role) =>
            selectedRoles.includes(role.id) &&
            OTHER_KHEDMA_STATUS_ROLES.some((status) => status.name === role.name),
        )
        .map((role) => role.name),
    );
    const hasStatus = inYear.some(
      (assignment) => selectedStatusNames.has(assignment.roleName) && !assignment.khedmaId,
    );
    const realKhedma = inYear.some((assignment) => Boolean(assignment.khedmaId));

    return hasStatus && realKhedma;
  }

  async function handleClearStatus(servant: ServantRow, roleName: string) {
    const clearingKey = `${servant.id}:${roleName}`;
    setClearingId(clearingKey);
    setError("");

    const result = await clearServantStatusRole(servant.id, selectedYear, roleName);
    setClearingId("");

    if ("error" in result) {
      setError(result.error);
      return;
    }

    const updated = {
      ...servant,
      assignments: servant.assignments.filter(
        (assignment) => !(assignment.year === selectedYear && assignment.roleName === roleName),
      ),
    };
    const removed = otherKhedmaOnly && !matchesOtherKhedmaFilter(updated);

    setServants((current) =>
      current.flatMap((item) => {
        if (item.id !== servant.id) {
          return [item];
        }

        return removed ? [] : [updated];
      }),
    );

    if (removed) {
      setTotal((current) => Math.max(0, current - 1));
    }

    if (editing?.id === servant.id) {
      closeForm();
    }

    router.refresh();
  }

  function renderClearStatus(servant: ServantRow) {
    const statuses = statusRolesToClear(servant);

    if (statuses.length === 0) {
      return null;
    }

    return statuses.map((status) => {
      const clearingKey = `${servant.id}:${status.name}`;

      return (
        <button
          key={status.name}
          type="button"
          onClick={() => void handleClearStatus(servant, status.name)}
          disabled={clearingId === clearingKey}
          className={adminActionOutline}
        >
          {clearingId === clearingKey ? "جاري الإزالة..." : status.clearLabel}
        </button>
      );
    });
  }

  async function handleExport() {
    setIsExporting(true);
    setError("");

    try {
      const pageParams = new URLSearchParams(window.location.search);
      const payload = {
        q: searchInput.trim() || pageParams.get("q") || "",
        role: serializeIdList(selectedRoles) || pageParams.get("role") || "",
        khedma: serializeIdList(selectedKhedmat) || pageParams.get("khedma") || "",
        year: String(selectedYear),
        other: otherKhedmaOnly && showOtherKhedmaToggle ? "1" : "",
        blood: selectedBloodType,
        rank: selectedDeaconRank,
      };

      const response = await fetch("/api/admin/servants/export", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("تعذر تصدير ملف Excel حالياً");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const suffix = payload.role || payload.khedma || payload.q || "all";
      link.download = `khodam-export-${suffix}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("تعذر تصدير ملف Excel حالياً");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative z-10 overflow-visible rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="servant-search">
            بحث عن خادم
          </label>
            <input
              id="servant-search"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-autocomplete="none"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onCompositionStart={() => {
                isComposing.current = true;
              }}
              onCompositionEnd={(event) => {
                isComposing.current = false;
                setSearchInput(event.currentTarget.value);
              }}
              placeholder="ابحث بالاسم أو رقم الموبايل أو الرقم القومي"
              className="min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
            />
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid w-full grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 xl:max-w-3xl">
              <MultiSelectFilter
                label="الرتبة"
                options={roleOptions}
                selectedIds={selectedRoles}
                onChange={handleRolesChange}
                emptyLabel="جميع الرتب"
                countLabel={(count) => `تم تحديد ${count} رتب`}
              />
              <MultiSelectFilter
                label="الخدمة"
                options={khedmaOptions}
                selectedIds={selectedKhedmat}
                onChange={handleKhedmatChange}
                emptyLabel="جميع الخدمات"
                countLabel={(count) => `تم تحديد ${count} خدمات`}
              />
              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-bold text-coptic-gold-dark">فصيلة الدم</span>
                <select
                  value={selectedBloodType}
                  onChange={(event) => handleBloodTypeChange(event.target.value)}
                  className="min-h-14 w-full rounded-2xl border border-coptic-gold-main/45 bg-white px-4 text-sm font-semibold text-deep-red outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">كل الفصائل</option>
                  {bloodTypes.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-bold text-coptic-gold-dark">الرتبة الشماسية</span>
                <select
                  value={selectedDeaconRank}
                  onChange={(event) => handleDeaconRankChange(event.target.value)}
                  className="min-h-14 w-full rounded-2xl border border-coptic-gold-main/45 bg-white px-4 text-sm font-semibold text-deep-red outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="">كل الرتب الشماسية</option>
                  {deaconRanks.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              {showOtherKhedmaToggle ? (
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-deep-red/20 bg-white px-4 text-sm font-bold text-deep-red sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={otherKhedmaOnly}
                    onChange={(event) => handleOtherKhedmaChange(event.target.checked)}
                    className="h-4 w-4 accent-deep-red"
                  />
                  مسند لخدمة أخرى
                </label>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto">
              <button type="button" onClick={openCreate} className={adminActionGold}>
                إضافة خادم
              </button>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={isExporting}
                className={adminActionOutline}
              >
                {isExporting ? "جاري التصدير..." : "تصدير إلى Excel"}
              </button>
              <Link href="/admin/servants/import" className={adminActionMuted}>
                رفع ملف Excel
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteAll(true)}
                disabled={total === 0 || isDeletingAll}
                className={adminActionDanger}
              >
                حذف الكل
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-deep-red/70">عدد الخدام: {total}</p>

      {error ? (
        <p role="alert" className="text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}

      {visibleServants.length === 0 ? (
        <AdminEmptyState>لا يوجد خدام مطابقون لبحثك</AdminEmptyState>
      ) : (
        <AdminResponsiveTable
          empty={false}
          emptyLabel="لا يوجد خدام"
          colSpan={7}
          head={
            <>
              <th className="px-4 py-3 font-bold">الاسم</th>
              <th className="px-4 py-3 font-bold">رقم الموبايل</th>
              <th className="px-4 py-3 font-bold">الرقم القومي</th>
              <th className="px-4 py-3 font-bold">الرتبة</th>
              <th className="px-4 py-3 font-bold">الخدمة الحالية</th>
              <th className="px-4 py-3 font-bold">تاريخ الإضافة</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={visibleServants.map((servant) => (
            <AdminMobileCard key={servant.id}>
              <div className="flex items-center gap-3">
                <ServantPhoto
                  name={servant.name}
                  photoUrl={servant.photoUrl}
                  onOpen={(src, photoName) => setPhotoPreview({ src, name: photoName })}
                />
                <button
                  type="button"
                  onClick={() => setDetails(servant)}
                  className="text-right font-bold text-deep-red underline-offset-2 hover:underline"
                >
                  {servant.name}
                </button>
              </div>
              <p className="mt-1 text-sm text-deep-red/80" dir="ltr">
                {displayPhone(servant.phone)}
              </p>
              <p className="mt-1 text-sm text-deep-red/80" dir="ltr">
                {maskNationalId(servant.nationalId)}
              </p>
              <div className="mt-2">
                <LabelChips
                  labels={uniqueLabels(servant.assignments.map((assignment) => assignment.roleName))}
                  emptyLabel="بدون رتبة"
                />
              </div>
              <div className="mt-2">
                <KhedmaChips assignments={servant.assignments} />
              </div>
              <p className="mt-1 text-sm text-deep-red/70" suppressHydrationWarning>
                {formatAddedAt(servant.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(servant)}
                  className={adminActionOutline}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(servant)}
                  className={adminActionMuted}
                >
                  حذف
                </button>
                {renderClearStatus(servant)}
              </div>
            </AdminMobileCard>
          ))}
          rows={visibleServants.map((servant) => (
            <tr key={servant.id} className="border-t border-coptic-gold-main/20 text-deep-red">
              <td className="px-4 py-3 font-bold">
                <div className="flex items-center gap-3">
                  <ServantPhoto
                    name={servant.name}
                    photoUrl={servant.photoUrl}
                    onOpen={(src, photoName) => setPhotoPreview({ src, name: photoName })}
                  />
                  <button
                    type="button"
                    onClick={() => setDetails(servant)}
                    className="text-right font-bold text-deep-red underline-offset-2 hover:underline"
                  >
                    {servant.name}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3" dir="ltr">
                {displayPhone(servant.phone)}
              </td>
              <td className="px-4 py-3" dir="ltr">
                {maskNationalId(servant.nationalId)}
              </td>
              <td className="px-4 py-3">
                <LabelChips
                  labels={uniqueLabels(servant.assignments.map((assignment) => assignment.roleName))}
                  emptyLabel="بدون رتبة"
                />
              </td>
              <td className="px-4 py-3">
                <KhedmaChips assignments={servant.assignments} />
              </td>
              <td className="whitespace-nowrap px-4 py-3" suppressHydrationWarning>
                {formatAddedAt(servant.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(servant)}
                    className={adminActionOutline}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(servant)}
                    className={adminActionMuted}
                  >
                    حذف
                  </button>
                  {renderClearStatus(servant)}
                </div>
              </td>
            </tr>
          ))}
        />
      )}

      <AnimatePresence>
        {isFormOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="إغلاق النموذج"
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 top-[6vh] z-50 mx-auto max-h-[88vh] w-auto max-w-xl overflow-y-auto rounded-2xl bg-cream p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="servant-form-title"
              suppressHydrationWarning
            >
              <h2 id="servant-form-title" className="text-lg font-bold text-deep-red">
                {title}
              </h2>
              <form
                onSubmit={(event) => void handleSubmit(event)}
                className="mt-4 space-y-4"
                autoComplete="off"
                suppressHydrationWarning
              >
                <div>
                  <label htmlFor="servant-name" className="mb-2 block text-sm font-bold text-deep-red">
                    الاسم
                  </label>
                  <input
                    id="servant-name"
                    required
                    autoComplete="off"
                    suppressHydrationWarning
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="servant-phone" className="mb-2 block text-sm font-bold text-deep-red">
                    رقم الموبايل
                  </label>
                  <input
                    id="servant-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    suppressHydrationWarning
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="اختياري"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="servant-national-id"
                    className="mb-2 block text-sm font-bold text-deep-red"
                  >
                    الرقم القومي
                  </label>
                  <input
                    id="servant-national-id"
                    inputMode="numeric"
                    autoComplete="off"
                    suppressHydrationWarning
                    value={form.nationalId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nationalId: event.target.value }))
                    }
                    placeholder="اختياري"
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="servant-address" className="mb-2 block text-sm font-bold text-deep-red">
                      العنوان
                    </label>
                    <input
                      id="servant-address"
                      autoComplete="off"
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="servant-job" className="mb-2 block text-sm font-bold text-deep-red">
                      المهنة/الدراسة
                    </label>
                    <input
                      id="servant-job"
                      autoComplete="off"
                      value={form.jobOrStudy}
                      onChange={(event) => setForm((current) => ({ ...current, jobOrStudy: event.target.value }))}
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="servant-graduation" className="mb-2 block text-sm font-bold text-deep-red">
                      سنة التخرج
                    </label>
                    <input
                      id="servant-graduation"
                      autoComplete="off"
                      value={form.graduationYear}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, graduationYear: event.target.value }))
                      }
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="servant-blood" className="mb-2 block text-sm font-bold text-deep-red">
                      فصيلة الدم
                    </label>
                    <input
                      id="servant-blood"
                      list="servant-blood-options"
                      autoComplete="off"
                      value={form.bloodType}
                      onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))}
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                    <datalist id="servant-blood-options">
                      {bloodTypes.map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="servant-deacon" className="mb-2 block text-sm font-bold text-deep-red">
                      الرتبة الشماسية
                    </label>
                    <input
                      id="servant-deacon"
                      list="servant-deacon-options"
                      autoComplete="off"
                      value={form.deaconRank}
                      onChange={(event) => setForm((current) => ({ ...current, deaconRank: event.target.value }))}
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                    <datalist id="servant-deacon-options">
                      {deaconRanks.map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="servant-emergency" className="mb-2 block text-sm font-bold text-deep-red">
                      طوارئ
                    </label>
                    <input
                      id="servant-emergency"
                      autoComplete="off"
                      value={form.emergencyContact}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, emergencyContact: event.target.value }))
                      }
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <ImageUpload
                      label="الصورة الشخصية"
                      hint="ارفع صورة من جهازك. تظهر بجانب اسم الخادم بعد الحفظ."
                      preview="circle"
                      value={form.photoUrl}
                      uploadFile={uploadServantPhoto}
                      onChange={(url) => setForm((current) => ({ ...current, photoUrl: url }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="servant-previous" className="mb-2 block text-sm font-bold text-deep-red">
                      خدمات سابقة
                    </label>
                    <textarea
                      id="servant-previous"
                      rows={3}
                      value={form.previousKhedmas}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, previousKhedmas: event.target.value }))
                      }
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="servant-notes" className="mb-2 block text-sm font-bold text-deep-red">
                      ملاحظات
                    </label>
                    <textarea
                      id="servant-notes"
                      rows={3}
                      value={form.extraNotes}
                      onChange={(event) => setForm((current) => ({ ...current, extraNotes: event.target.value }))}
                      placeholder="اختياري"
                      className={fieldClass}
                    />
                  </div>
                </div>
                {formError ? (
                  <p role="alert" className="text-sm font-medium text-deep-red">
                    {formError}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={adminActionGold}>
                    حفظ
                  </button>
                  <button type="button" onClick={closeForm} className={adminActionOutline}>
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {details ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="إغلاق التفاصيل"
              onClick={() => setDetails(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] w-auto max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="servant-details-title"
            >
              <div className="flex items-center gap-4">
                <ServantPhoto
                  name={details.name}
                  photoUrl={details.photoUrl}
                  size="details"
                  onOpen={(src, photoName) => setPhotoPreview({ src, name: photoName })}
                />
                <div>
                  <h2 id="servant-details-title" className="text-lg font-bold text-deep-red">
                    {details.name}
                  </h2>
                  <p className="mt-2 text-sm text-deep-red/75" dir="ltr">
                    {displayPhone(details.phone)} — {maskNationalId(details.nationalId)}
                  </p>
                </div>
              </div>
              <ProfileDetails servant={details} />
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(details)} className={adminActionGold}>
                  تعديل
                </button>
                <button type="button" onClick={() => setDetails(null)} className={adminActionOutline}>
                  إغلاق
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleting ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="إغلاق تأكيد الحذف"
              onClick={() => setDeleting(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 top-[20vh] z-50 mx-auto w-auto max-w-md rounded-2xl bg-cream p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-servant-title"
            >
              <h2 id="delete-servant-title" className="text-lg font-bold text-deep-red">
                تأكيد الحذف
              </h2>
              <p className="mt-3 text-sm leading-7 text-deep-red/80">
                هل أنت متأكد من حذف {deleting.name}؟ التعيينات هتتمسح كمان.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => void confirmDelete()} className={adminActionGold}>
                  نعم، حذف
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  className={adminActionOutline}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteAll ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              aria-label="إغلاق تأكيد حذف الكل"
              onClick={() => {
                if (!isDeletingAll) {
                  setShowDeleteAll(false);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-4 top-[20vh] z-50 mx-auto w-auto max-w-md rounded-2xl bg-cream p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-all-servants-title"
            >
              <h2 id="delete-all-servants-title" className="text-lg font-bold text-deep-red">
                حذف جميع الخدام
              </h2>
              <p className="mt-3 text-sm leading-7 text-deep-red/80">
                هل أنت متأكد من حذف كل الخدام ({total})؟ التعيينات هتتمسح كمان، وبعد كده تقدر ترفع شيت
                الإكسيل من جديد من غير تكرار.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={() => void confirmDeleteAll()}
                  className={adminActionDanger}
                >
                  {isDeletingAll ? "جاري الحذف..." : "نعم، حذف الكل"}
                </button>
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={() => setShowDeleteAll(false)}
                  className={adminActionOutline}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {photoPreview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`صورة ${photoPreview.name}`}
            onClick={() => setPhotoPreview(null)}
          >
            <button
              type="button"
              onClick={() => setPhotoPreview(null)}
              className="absolute end-4 top-4 min-h-11 rounded-full bg-white px-4 text-sm font-bold text-deep-red"
            >
              إغلاق
            </button>
            <img
              src={photoPreview.src}
              alt={`صورة ${photoPreview.name}`}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[88vh] max-w-[min(92vw,56rem)] rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
