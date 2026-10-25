"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { adminActionGold, adminActionOutline } from "@/components/admin/admin-ui";
import {
  BIRTHDATE_EXPORT_LABEL,
  DEFAULT_SERVANT_EXPORT_FIELDS,
  SERVANT_EXPORT_FIELDS,
  isBirthdateExportField,
  orderedServantExportFields,
  type ServantExportField,
} from "@/lib/servant-export";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="m7 11 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

export default function ServantExportDialog({
  open,
  isExporting,
  onClose,
  onDownload,
}: {
  open: boolean;
  isExporting: boolean;
  onClose: () => void;
  onDownload: (fields: ServantExportField[]) => void;
}) {
  const titleId = useId();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<ServantExportField[]>(DEFAULT_SERVANT_EXPORT_FIELDS);
  const allSelected = selected.length === SERVANT_EXPORT_FIELDS.length;
  const someSelected = selected.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isExporting) {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isExporting, onClose, open]);

  function toggleAll() {
    setSelected(allSelected ? [] : SERVANT_EXPORT_FIELDS.map((field) => field.key));
  }

  function toggleField(field: ServantExportField) {
    setSelected((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
    );
  }

  function renderField(field: (typeof SERVANT_EXPORT_FIELDS)[number]) {
    return (
      <label
        key={field.key}
        className="flex min-h-11 items-center gap-3 rounded-xl border border-deep-red/15 bg-white px-4 py-2 text-sm font-bold text-deep-red"
      >
        <input
          type="checkbox"
          checked={selected.includes(field.key)}
          onChange={() => toggleField(field.key)}
          className="h-4 w-4 accent-deep-red"
        />
        {field.label}
      </label>
    );
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="إغلاق تحديد البيانات"
            onClick={() => {
              if (!isExporting) {
                onClose();
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] w-auto max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="text-lg font-bold text-deep-red">
              تحديد البيانات المطلوبة
            </h2>
            <p className="mt-2 text-sm leading-7 text-deep-red/75">
              الملف هيضم البيانات اللي هتحددها، حسب البحث والتصفية الحاليين.
            </p>
            <fieldset className="mt-4 space-y-2" disabled={isExporting}>
              <legend className="sr-only">بيانات الملف</legend>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-coptic-gold-main/50 bg-white px-4 py-2 text-sm font-bold text-deep-red">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-deep-red"
                />
                تحديد الكل
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SERVANT_EXPORT_FIELDS.filter((field) => !isBirthdateExportField(field.key)).map(
                  renderField,
                )}
              </div>
              <fieldset className="rounded-xl border border-coptic-gold-main/40 bg-white/70 p-3">
                <legend className="px-2 text-sm font-bold text-coptic-gold-dark">
                  {BIRTHDATE_EXPORT_LABEL}
                </legend>
                <p className="mb-2 text-xs leading-6 text-deep-red/70">
                  بتنزل تحت عنوان تاريخ الميلاد، كل جزء في عمود: يوم ثم شهر ثم سنة.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SERVANT_EXPORT_FIELDS.filter((field) => isBirthdateExportField(field.key)).map(
                    renderField,
                  )}
                </div>
              </fieldset>
            </fieldset>
            {selected.length === 0 ? (
              <p className="mt-3 text-sm font-medium text-deep-red">حدد بيانات واحدة على الأقل</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isExporting || selected.length === 0}
                onClick={() => onDownload(orderedServantExportFields(selected))}
                className={`${adminActionGold} gap-2`}
              >
                <DownloadIcon />
                {isExporting ? "جاري التحميل..." : "تحميل الملف"}
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={onClose}
                className={adminActionOutline}
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
