"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBaptismRecord,
  deleteDepartedRecord,
  deleteMarriageRecord,
} from "@/actions/registry";
import RegistryAnniversaries from "@/components/admin/RegistryAnniversaries";
import RegistryRecordDialog, { type EditorState } from "@/components/admin/RegistryRecordDialog";
import {
  AdminActions,
  AdminEmptyState,
  AdminPageHeader,
  AdminResponsiveTable,
  adminActionDanger,
  adminActionOutline,
} from "@/components/admin/admin-ui";
import { normalizeArabic } from "@/lib/arabicNormalizer";
import {
  displayText,
  formatRegistryDate,
  isRegistryDateInRange,
  joinPersonNames,
  type BaptismRecordItem,
  type DepartedRecordItem,
  type MarriageRecordItem,
  type RegistryPageTab,
  type RegistryTab,
} from "@/lib/registry";

const tabs: Array<{ id: RegistryTab; label: string; addLabel: string; emptyLabel: string; searchLabel: string }> = [
  {
    id: "baptisms",
    label: "المعموديات",
    addLabel: "إضافة معمودية",
    emptyLabel: "لا توجد سجلات معمودية",
    searchLabel: "ابحث بالاسم أو رقم المسلسل أو الكاهن",
  },
  {
    id: "marriages",
    label: "المتزوجون",
    addLabel: "إضافة زواج",
    emptyLabel: "لا توجد سجلات زواج",
    searchLabel: "ابحث باسم العريس أو العروسة أو رقم الموبايل",
  },
  {
    id: "departed",
    label: "المنتقلون",
    addLabel: "إضافة نياحة",
    emptyLabel: "لا توجد سجلات نياحة",
    searchLabel: "ابحث بالاسم أو رقم الموبايل أو مكان المدفن",
  },
];

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold";

const addClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black";

function matches(values: string[], query: string) {
  const needle = normalizeArabic(query.trim());

  if (!needle) {
    return true;
  }

  return values.some((value) => normalizeArabic(value).includes(needle));
}

function RecordActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <AdminActions>
      <button type="button" onClick={onEdit} className={adminActionOutline}>
        تعديل
      </button>
      <button type="button" onClick={onDelete} className={adminActionDanger}>
        حذف
      </button>
    </AdminActions>
  );
}

function PhoneValue({ value }: { value: string }) {
  if (!value.trim()) {
    return "—";
  }

  return (
    <span dir="ltr" className="inline-block">
      {value}
    </span>
  );
}

export default function RegistryManager({
  initialTab,
  baptisms,
  marriages,
  departed,
}: {
  initialTab: RegistryPageTab;
  baptisms: BaptismRecordItem[];
  marriages: MarriageRecordItem[];
  departed: DepartedRecordItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const closeEditor = useCallback(() => setEditor(null), []);
  const isAnniversaryTab = tab === "anniversaries";
  const current = tabs.find((item) => item.id === tab) ?? tabs[0];
  const visibleBaptisms = useMemo(
    () =>
      baptisms.filter(
        (record) =>
          isRegistryDateInRange(record.baptismDate, dateFrom, dateTo) &&
          matches(
            [
              record.serialNumber,
              record.baptismDate,
              record.birthName,
              record.baptismName,
              record.fatherName,
              record.fatherPhone,
              record.motherName,
              record.priest,
            ],
            query,
          ),
      ),
    [baptisms, query, dateFrom, dateTo],
  );
  const visibleMarriages = useMemo(
    () =>
      marriages.filter(
        (record) =>
          isRegistryDateInRange(record.weddingDate, dateFrom, dateTo) &&
          matches(
            [
              record.serialNumber,
              record.husbandName,
              record.wifeName,
              record.husbandPhone,
              record.wifePhone,
              record.weddingChurch,
              record.priest,
              record.weddingTime,
            ],
            query,
          ),
      ),
    [marriages, query, dateFrom, dateTo],
  );
  const visibleDeparted = useMemo(
    () =>
      departed.filter(
        (record) =>
          isRegistryDateInRange(record.funeralDate, dateFrom, dateTo) &&
          matches(
            [
              record.serialNumber,
              record.departedName,
              record.spouseName,
              record.childrenNames,
              record.contactMobile,
              record.contactOwner,
              record.funeralPlace,
              record.burialPlace,
              record.priest,
              record.notes,
            ],
            query,
          ),
      ),
    [departed, query, dateFrom, dateTo],
  );
  const counts: Record<RegistryTab, number> = {
    baptisms: baptisms.length,
    marriages: marriages.length,
    departed: departed.length,
  };
  const visibleCount =
    tab === "baptisms" ? visibleBaptisms.length : tab === "marriages" ? visibleMarriages.length : visibleDeparted.length;
  const emptyLabel = query.trim() || dateFrom || dateTo ? "لا توجد نتائج مطابقة" : current.emptyLabel;

  async function remove(kind: RegistryTab, id: string) {
    if (!window.confirm("هل تريد حذف هذا السجل؟ لا يمكن التراجع عن الحذف.")) {
      return;
    }

    const result =
      kind === "baptisms"
        ? await deleteBaptismRecord(id)
        : kind === "marriages"
          ? await deleteMarriageRecord(id)
          : await deleteDepartedRecord(id);

    if (!result.success) {
      window.alert(result.error);
      return;
    }

    if (editor?.mode === "edit" && editor.id === id) {
      setEditor(null);
    }

    router.refresh();
  }

  return (
    <>
      <AdminPageHeader
        title="سجل الكنيسة"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            سجل المعموديات والمتزوجين والمنتقلين، مع التذكارات السنوية. عند كتابة الاسم يمكن ربطه بخادم موجود، أو حفظ أي اسم غير مسجل.
          </p>
        }
        action={
          isAnniversaryTab ? undefined : (
            <button
              type="button"
              onClick={() => setEditor({ mode: "create", kind: tab })}
              className={addClassName}
            >
              {current.addLabel}
            </button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const isActive = item.id === tab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setQuery("");
                setDateFrom("");
                setDateTo("");
                setEditor(null);
              }}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition ${
                isActive
                  ? "bg-gray-900 text-coptic-gold-main"
                  : "border border-coptic-gold-main/40 bg-white text-deep-red hover:border-coptic-gold-main"
              }`}
            >
              {item.label} ({counts[item.id]})
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setTab("anniversaries");
            setQuery("");
            setDateFrom("");
            setDateTo("");
            setEditor(null);
          }}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition ${
            isAnniversaryTab
              ? "bg-gray-900 text-coptic-gold-main"
              : "border border-coptic-gold-main/40 bg-white text-deep-red hover:border-coptic-gold-main"
          }`}
        >
          التذكارات السنوية
        </button>
      </div>

      {isAnniversaryTab ? (
        <RegistryAnniversaries baptisms={baptisms} marriages={marriages} departed={departed} />
      ) : (
        <>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block" htmlFor="registry-search">
          <span className="mb-2 block text-sm font-bold text-deep-red">بحث</span>
          <input
            id="registry-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={current.searchLabel}
            className={fieldClassName}
          />
        </label>
        <label className="block" htmlFor="registry-from">
          <span className="mb-2 block text-sm font-bold text-deep-red">من</span>
          <input
            id="registry-from"
            type="date"
            dir="ltr"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block" htmlFor="registry-to">
          <span className="mb-2 block text-sm font-bold text-deep-red">إلى</span>
          <input
            id="registry-to"
            type="date"
            dir="ltr"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <span className="block text-xs text-deep-red/60 md:col-span-3">
          {visibleCount} من {counts[current.id]}
        </span>
      </div>

      {tab === "baptisms" ? (
        <AdminResponsiveTable
          empty={visibleBaptisms.length === 0}
          emptyLabel={emptyLabel}
          colSpan={8}
          head={
            <>
              <th className="px-4 py-3 font-bold">مسلسل</th>
              <th className="px-4 py-3 font-bold">تاريخ المعمودية</th>
              <th className="px-4 py-3 font-bold">الاسم بالميلاد</th>
              <th className="px-4 py-3 font-bold">الاسم بالمعمودية</th>
              <th className="px-4 py-3 font-bold">الأب</th>
              <th className="px-4 py-3 font-bold">الأم</th>
              <th className="px-4 py-3 font-bold">شهادة العماد</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={
            visibleBaptisms.length === 0 ? (
              <AdminEmptyState>{emptyLabel}</AdminEmptyState>
            ) : (
              visibleBaptisms.map((record) => (
                <article key={record.id} className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", kind: "baptisms", id: record.id })}
                    className="text-right text-base font-bold text-deep-red"
                  >
                    {record.baptismName || record.birthName || "بدون اسم"}
                  </button>
                  <p className="mt-2 text-sm text-deep-red/80">تاريخ المعمودية: {formatRegistryDate(record.baptismDate)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">الأب: {displayText(record.fatherName)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">الأم: {displayText(record.motherName)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">
                    شهادة العماد: {record.receivedCertificate ? "تم الاستلام" : "لم تُستلم"}
                  </p>
                  <div className="mt-3">
                    <RecordActions
                      onEdit={() => setEditor({ mode: "edit", kind: "baptisms", id: record.id })}
                      onDelete={() => void remove("baptisms", record.id)}
                    />
                  </div>
                </article>
              ))
            )
          }
          rows={visibleBaptisms.map((record) => (
            <tr key={record.id} className="border-t border-coptic-gold-main/15">
              <td className="px-4 py-3">{displayText(record.serialNumber)}</td>
              <td className="px-4 py-3">{formatRegistryDate(record.baptismDate)}</td>
              <td className="px-4 py-3 font-bold">{displayText(record.birthName)}</td>
              <td className="px-4 py-3">{displayText(record.baptismName)}</td>
              <td className="px-4 py-3">{displayText(record.fatherName)}</td>
              <td className="px-4 py-3">{displayText(record.motherName)}</td>
              <td className="px-4 py-3">{record.receivedCertificate ? "نعم" : "لا"}</td>
              <td className="px-4 py-3">
                <RecordActions
                  onEdit={() => setEditor({ mode: "edit", kind: "baptisms", id: record.id })}
                  onDelete={() => void remove("baptisms", record.id)}
                />
              </td>
            </tr>
          ))}
        />
      ) : null}

      {tab === "marriages" ? (
        <AdminResponsiveTable
          empty={visibleMarriages.length === 0}
          emptyLabel={emptyLabel}
          colSpan={7}
          head={
            <>
              <th className="px-4 py-3 font-bold">مسلسل</th>
              <th className="px-4 py-3 font-bold">تاريخ الإكليل</th>
              <th className="px-4 py-3 font-bold">العريس</th>
              <th className="px-4 py-3 font-bold">العروسة</th>
              <th className="px-4 py-3 font-bold">الكنيسة</th>
              <th className="px-4 py-3 font-bold">خادم</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={
            visibleMarriages.length === 0 ? (
              <AdminEmptyState>{emptyLabel}</AdminEmptyState>
            ) : (
              visibleMarriages.map((record) => (
                <article key={record.id} className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", kind: "marriages", id: record.id })}
                    className="text-right text-base font-bold text-deep-red"
                  >
                    {joinPersonNames(record.husbandName, record.wifeName)}
                  </button>
                  <p className="mt-2 text-sm text-deep-red/80">تاريخ الإكليل: {formatRegistryDate(record.weddingDate)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">
                    موبايل العريس: <PhoneValue value={record.husbandPhone} />
                  </p>
                  <p className="mt-1 text-sm text-deep-red/80">
                    موبايل العروسة: <PhoneValue value={record.wifePhone} />
                  </p>
                  <div className="mt-3">
                    <RecordActions
                      onEdit={() => setEditor({ mode: "edit", kind: "marriages", id: record.id })}
                      onDelete={() => void remove("marriages", record.id)}
                    />
                  </div>
                </article>
              ))
            )
          }
          rows={visibleMarriages.map((record) => (
            <tr key={record.id} className="border-t border-coptic-gold-main/15">
              <td className="px-4 py-3">{displayText(record.serialNumber)}</td>
              <td className="px-4 py-3">{formatRegistryDate(record.weddingDate)}</td>
              <td className="px-4 py-3 font-bold">{displayText(record.husbandName)}</td>
              <td className="px-4 py-3 font-bold">{displayText(record.wifeName)}</td>
              <td className="px-4 py-3">{displayText(record.weddingChurch)}</td>
              <td className="px-4 py-3">
                {record.isHusbandServant || record.isWifeServant
                  ? [record.isHusbandServant ? "العريس" : null, record.isWifeServant ? "العروسة" : null]
                      .filter(Boolean)
                      .join(" و ")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <RecordActions
                  onEdit={() => setEditor({ mode: "edit", kind: "marriages", id: record.id })}
                  onDelete={() => void remove("marriages", record.id)}
                />
              </td>
            </tr>
          ))}
        />
      ) : null}

      {tab === "departed" ? (
        <AdminResponsiveTable
          empty={visibleDeparted.length === 0}
          emptyLabel={emptyLabel}
          colSpan={7}
          head={
            <>
              <th className="px-4 py-3 font-bold">مسلسل</th>
              <th className="px-4 py-3 font-bold">الاسم</th>
              <th className="px-4 py-3 font-bold">تاريخ التجنيز</th>
              <th className="px-4 py-3 font-bold">العمر</th>
              <th className="px-4 py-3 font-bold">موبايل التواصل</th>
              <th className="px-4 py-3 font-bold">خادم</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={
            visibleDeparted.length === 0 ? (
              <AdminEmptyState>{emptyLabel}</AdminEmptyState>
            ) : (
              visibleDeparted.map((record) => (
                <article key={record.id} className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", kind: "departed", id: record.id })}
                    className="text-right text-base font-bold text-deep-red"
                  >
                    {record.departedName || "بدون اسم"}
                  </button>
                  <p className="mt-2 text-sm text-deep-red/80">تاريخ التجنيز: {formatRegistryDate(record.funeralDate)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">العمر: {displayText(record.ageAtDeath)}</p>
                  <p className="mt-1 text-sm text-deep-red/80">
                    الموبايل: <PhoneValue value={record.contactMobile} />
                  </p>
                  <p className="mt-1 text-sm text-deep-red/80">{record.isServant ? "خادم" : "ليس خادماً"}</p>
                  <div className="mt-3">
                    <RecordActions
                      onEdit={() => setEditor({ mode: "edit", kind: "departed", id: record.id })}
                      onDelete={() => void remove("departed", record.id)}
                    />
                  </div>
                </article>
              ))
            )
          }
          rows={visibleDeparted.map((record) => (
            <tr key={record.id} className="border-t border-coptic-gold-main/15">
              <td className="px-4 py-3">{displayText(record.serialNumber)}</td>
              <td className="px-4 py-3 font-bold">{displayText(record.departedName)}</td>
              <td className="px-4 py-3">{formatRegistryDate(record.funeralDate)}</td>
              <td className="px-4 py-3">{displayText(record.ageAtDeath)}</td>
              <td className="px-4 py-3">
                <PhoneValue value={record.contactMobile} />
              </td>
              <td className="px-4 py-3">{record.isServant ? "نعم" : "لا"}</td>
              <td className="px-4 py-3">
                <RecordActions
                  onEdit={() => setEditor({ mode: "edit", kind: "departed", id: record.id })}
                  onDelete={() => void remove("departed", record.id)}
                />
              </td>
            </tr>
          ))}
        />
      ) : null}
        </>
      )}

      {editor ? (
        <RegistryRecordDialog
          editor={editor}
          baptisms={baptisms}
          marriages={marriages}
          departed={departed}
          onClose={closeEditor}
        />
      ) : null}
    </>
  );
}
