"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  listServantRoles,
  searchServants,
  type ServantSearchHit,
} from "@/actions/tawze3a-admin";
import type { ServantRoleOption } from "@/lib/servant-roles";

const toast = {
  success(message: string, show: (value: string) => void) {
    show(message);
  },
};

export default function ServantSearchDialog({
  open,
  assignedServantIds,
  defaultRoleId,
  onClose,
  onSelect,
}: {
  open: boolean;
  assignedServantIds: string[];
  defaultRoleId?: string;
  onClose: () => void;
  onSelect: (
    servant: ServantSearchHit,
    roleId: string,
  ) => Promise<boolean | void> | boolean | void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ServantSearchHit[]>([]);
  const [roles, setRoles] = useState<ServantRoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(defaultRoleId ?? "");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError("");
      setIsSearching(false);
      setToastMessage("");
      return;
    }

    setSelectedRoleId(defaultRoleId ?? "");

    void listServantRoles().then((items) => {
      setRoles(items);
      setSelectedRoleId((current) => current || defaultRoleId || items[0]?.id || "");
    });
  }, [open, defaultRoleId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handle = window.setTimeout(() => {
      const value = query.trim();

      if (!value) {
        setResults([]);
        setIsSearching(false);
        setError("");
        return;
      }

      setIsSearching(true);

      void searchServants(value).then((result) => {
        setIsSearching(false);

        if (!result.success) {
          setResults([]);
          setError(result.error);
          return;
        }

        setError("");
        setResults(result.servants);
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const handle = window.setTimeout(() => setToastMessage(""), 1800);
    return () => window.clearTimeout(handle);
  }, [toastMessage]);

  async function handlePick(servant: ServantSearchHit) {
    if (!selectedRoleId) {
      setError("يرجى اختيار رتبة الخادم");
      return;
    }

    const ok = await onSelect(servant, selectedRoleId);

    if (ok === false) {
      return;
    }

    setQuery("");
    setResults([]);
    toast.success("تمت إضافة الخادم بنجاح", setToastMessage);
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
            aria-label="إغلاق البحث"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-4 top-[12vh] z-50 mx-auto w-auto max-w-lg rounded-2xl bg-cream p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="servant-search-title"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="servant-search-title" className="text-lg font-bold text-deep-red">
                البحث عن خادم
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-coptic-gold-dark hover:bg-coptic-gold-main/15"
              >
                إغلاق
              </button>
            </div>

            <label className="mt-4 block text-sm font-bold text-deep-red" htmlFor="servant-role">
              الرتبة
            </label>
            <select
              id="servant-role"
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
            >
              {roles.length === 0 ? (
                <option value="">لا توجد رتب بعد</option>
              ) : (
                roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              )}
            </select>

            <label className="mt-4 block text-sm font-bold text-deep-red" htmlFor="servant-search">
              اسم الخادم
            </label>
            <input
              id="servant-search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="اكتب الاسم للبحث..."
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
            />

            <div className="mt-4 max-h-72 overflow-y-auto">
              {isSearching ? (
                <p className="py-6 text-center text-sm text-deep-red/70">جاري البحث...</p>
              ) : error ? (
                <p className="py-6 text-center text-sm text-deep-red">{error}</p>
              ) : !query.trim() ? (
                <p className="py-6 text-center text-sm text-deep-red/70">ابدأ بكتابة اسم الخادم</p>
              ) : results.length === 0 ? (
                <p className="py-6 text-center text-sm text-deep-red/70">لا توجد نتائج مطابقة</p>
              ) : (
                <ul className="space-y-2">
                  {results.map((servant) => {
                    const assigned = assignedServantIds.includes(servant.id);

                    return (
                      <li key={servant.id}>
                        <button
                          type="button"
                          disabled={assigned}
                          onClick={() => void handlePick(servant)}
                          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-coptic-gold-main/30 bg-white px-4 py-3 text-right disabled:opacity-50"
                        >
                          <span>
                            <span className="block font-bold text-deep-red">{servant.name}</span>
                            <span className="block text-xs text-deep-red/70" dir="ltr">
                              {servant.phone || "غير مسجل"}
                            </span>
                          </span>
                          <span className="text-xs font-bold text-coptic-gold-dark">
                            {assigned ? "مضاف" : "إضافة"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <AnimatePresence>
              {toastMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  role="status"
                  className="mt-4 rounded-xl bg-green-700 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  {toastMessage}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
