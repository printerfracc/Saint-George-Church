"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type MultiSelectOption = {
  id: string;
  label: string;
};

export default function MultiSelectFilter({
  label,
  options,
  selectedIds,
  onChange,
  emptyLabel,
  countLabel,
}: {
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel: string;
  countLabel: (count: number) => string;
}) {
  const buttonId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = options.length > 0 && options.every((option) => selectedSet.has(option.id));

  const buttonText = useMemo(() => {
    if (selectedIds.length === 0) {
      return emptyLabel;
    }

    if (selectedIds.length === 1) {
      return options.find((option) => option.id === selectedIds[0])?.label ?? emptyLabel;
    }

    return countLabel(selectedIds.length);
  }, [countLabel, emptyLabel, options, selectedIds]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((value) => value !== id));
      return;
    }

    onChange([...selectedIds, id]);
  }

  const active = selectedIds.length > 0;

  return (
    <div ref={rootRef} className="relative z-20 min-w-0 w-full">
      <button
        id={buttonId}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-2 text-right shadow-sm outline-none transition hover:border-coptic-gold-main focus:ring-2 focus:ring-gold ${
          open || active
            ? "border-coptic-gold-main ring-1 ring-coptic-gold-main/40"
            : "border-coptic-gold-main/45"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-bold leading-4 text-coptic-gold-dark">{label}</span>
          <span className="block truncate text-sm font-semibold leading-6 text-deep-red">{buttonText}</span>
        </span>
        <span
          aria-hidden="true"
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-coptic-gold-main/50 bg-cream text-deep-red transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={listId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute start-0 z-30 mt-2 w-max min-w-full max-w-[min(24rem,90vw)] overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white text-right shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 border-b border-coptic-gold-main/25 bg-cream/70 px-3 py-2">
              <button
                type="button"
                onClick={() => onChange(options.map((option) => option.id))}
                disabled={options.length === 0 || allSelected}
                className="text-xs font-bold text-deep-red disabled:text-deep-red/40"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={selectedIds.length === 0}
                className="text-xs font-bold text-deep-red disabled:text-deep-red/40"
              >
                مسح التحديد
              </button>
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-deep-red/60">لا توجد خيارات</li>
              ) : (
                options.map((option) => {
                  const checked = selectedSet.has(option.id);
                  const optionId = `${buttonId}-${option.id}`;

                  return (
                    <li key={option.id}>
                      <label
                        htmlFor={optionId}
                        className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-deep-red hover:bg-cream ${
                          checked ? "bg-coptic-gold-main/10" : ""
                        }`}
                      >
                        <input
                          id={optionId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(option.id)}
                          className="size-4 shrink-0 rounded border-deep-red/30 accent-deep-red"
                        />
                        <span className="min-w-0 text-right leading-6">{option.label}</span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
