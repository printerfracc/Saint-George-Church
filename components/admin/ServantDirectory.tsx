"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  createServant,
  deleteAllServants,
  deleteServant,
  updateServant,
  type ServantAssignmentChip,
  type ServantRecord,
} from "@/actions/servants-crud";
import MultiSelectFilter from "@/components/admin/MultiSelectFilter";
import type { ServantRoleOption } from "@/lib/servant-roles";
import {
  serializeIdList,
  servantMatchesFilters,
  UNASSIGNED_KHEDMA_VALUE,
} from "@/lib/servant-filters";
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

function AssignmentChips({ assignments }: { assignments: ServantAssignmentChip[] }) {
  if (assignments.length === 0) {
    return <span className="text-gray-400">غير مسند</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {assignments.map((assignment) => (
        <span
          key={assignment.id}
          className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
        >
          {assignment.khedmaName} - {assignment.roleName}
        </span>
      ))}
    </span>
  );
}

type ServantFormState = {
  name: string;
  phone: string;
  nationalId: string;
};

const emptyForm: ServantFormState = {
  name: "",
  phone: "",
  nationalId: "",
};

export default function ServantDirectory({
  initialServants,
  initialTotal,
  khedmat,
  roles,
  query,
  roleIds,
  khedmaIds,
}: {
  initialServants: ServantRow[];
  initialTotal: number;
  khedmat: KhedmaFilterOption[];
  roles: ServantRoleOption[];
  query: string;
  roleIds: string[];
  khedmaIds: string[];
}) {
  const router = useRouter();
  const [servants, setServants] = useState(initialServants);
  const [total, setTotal] = useState(initialTotal);
  const [searchInput, setSearchInput] = useState(query);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(roleIds);
  const [selectedKhedmat, setSelectedKhedmat] = useState<string[]>(khedmaIds);
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
  const incomingRoleKey = serializeIdList(roleIds);
  const incomingKhedmaKey = serializeIdList(khedmaIds);

  useEffect(() => {
    setServants(initialServants);
    setTotal(initialTotal);
  }, [initialServants, initialTotal]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (skipFilterSync.current) {
      skipFilterSync.current = false;
      return;
    }

    setSelectedRoles(roleIds);
    setSelectedKhedmat(khedmaIds);
  }, [incomingKhedmaKey, incomingRoleKey, khedmaIds, roleIds]);

  const roleOptions = useMemo(
    () => roles.map((item) => ({ id: item.id, label: item.name })),
    [roles],
  );

  const khedmaOptions = useMemo(
    () => [
      { id: UNASSIGNED_KHEDMA_VALUE, label: "غير مسند لأي خدمة" },
      ...khedmat.map((item) => ({
        id: item.id,
        label: item.tawze3aTitle ? `${item.name} — ${item.tawze3aTitle}` : item.name,
      })),
    ],
    [khedmat],
  );

  const visibleServants = useMemo(
    () =>
      servants.filter((servant) =>
        servantMatchesFilters(servant, selectedRoles, selectedKhedmat),
      ),
    [selectedKhedmat, selectedRoles, servants],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQuery = searchInput.trim();

      if (nextQuery === query) {
        return;
      }

      replaceFilters({ q: nextQuery });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput, query, selectedRoles, selectedKhedmat]);

  const title = useMemo(
    () => (editing ? "تعديل خادم" : "إضافة خادم"),
    [editing],
  );

  function replaceFilters(next: { q?: string; roleIds?: string[]; khedmaIds?: string[] }) {
    const params = new URLSearchParams();
    const nextQuery = "q" in next ? next.q ?? "" : query;
    const nextRoles = "roleIds" in next ? next.roleIds ?? [] : selectedRoles;
    const nextKhedmat = "khedmaIds" in next ? next.khedmaIds ?? [] : selectedKhedmat;
    const nextRole = serializeIdList(nextRoles);
    const nextKhedma = serializeIdList(nextKhedmat);

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (nextRole) {
      params.set("role", nextRole);
    }

    if (nextKhedma) {
      params.set("khedma", nextKhedma);
    }

    const qs = params.toString();
    router.replace(qs ? `/admin/servants?${qs}` : "/admin/servants");
  }

  function handleRolesChange(ids: string[]) {
    skipFilterSync.current = true;
    setSelectedRoles(ids);
    replaceFilters({ roleIds: ids });
  }

  function handleKhedmatChange(ids: string[]) {
    skipFilterSync.current = true;
    setSelectedKhedmat(ids);
    replaceFilters({ khedmaIds: ids });
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEdit(servant: ServantRow) {
    setEditing(servant);
    setForm({
      name: servant.name,
      phone: servant.phone ?? "",
      nationalId: servant.nationalId ?? "",
    });
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

  async function handleExport() {
    setIsExporting(true);
    setError("");

    try {
      const pageParams = new URLSearchParams(window.location.search);
      const payload = {
        q: searchInput.trim() || pageParams.get("q") || "",
        role: serializeIdList(selectedRoles) || pageParams.get("role") || "",
        khedma: serializeIdList(selectedKhedmat) || pageParams.get("khedma") || "",
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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-visible sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="servant-search">
              بحث عن خادم
            </label>
            <input
              id="servant-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ابحث بالاسم أو رقم الموبايل"
              className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
            />
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
          colSpan={6}
          head={
            <>
              <th className="px-4 py-3 font-bold">الاسم</th>
              <th className="px-4 py-3 font-bold">رقم الموبايل</th>
              <th className="px-4 py-3 font-bold">الرقم القومي</th>
              <th className="px-4 py-3 font-bold">الخدمة الحالية</th>
              <th className="px-4 py-3 font-bold">تاريخ الإضافة</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={visibleServants.map((servant) => (
            <AdminMobileCard key={servant.id}>
              <p className="font-bold text-deep-red">{servant.name}</p>
              <p className="mt-1 text-sm text-deep-red/80" dir="ltr">
                {displayPhone(servant.phone)}
              </p>
              <p className="mt-1 text-sm text-deep-red/80" dir="ltr">
                {maskNationalId(servant.nationalId)}
              </p>
              <div className="mt-2">
                <AssignmentChips assignments={servant.assignments} />
              </div>
              <p className="mt-1 text-sm text-deep-red/70">
                {new Date(servant.createdAt).toLocaleString("ar-EG")}
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
              </div>
            </AdminMobileCard>
          ))}
          rows={visibleServants.map((servant) => (
            <tr key={servant.id} className="border-t border-coptic-gold-main/20 text-deep-red">
              <td className="px-4 py-3 font-bold">{servant.name}</td>
              <td className="px-4 py-3" dir="ltr">
                {displayPhone(servant.phone)}
              </td>
              <td className="px-4 py-3" dir="ltr">
                {maskNationalId(servant.nationalId)}
              </td>
              <td className="px-4 py-3">
                <AssignmentChips assignments={servant.assignments} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {new Date(servant.createdAt).toLocaleString("ar-EG")}
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
              className="fixed inset-x-4 top-[10vh] z-50 mx-auto w-auto max-w-lg rounded-2xl bg-cream p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="servant-form-title"
            >
              <h2 id="servant-form-title" className="text-lg font-bold text-deep-red">
                {title}
              </h2>
              <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="servant-name" className="mb-2 block text-sm font-bold text-deep-red">
                    الاسم
                  </label>
                  <input
                    id="servant-name"
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
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
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
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
                    value={form.nationalId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nationalId: event.target.value }))
                    }
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
                  />
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
    </div>
  );
}
