"use client";

import { startTransition, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchRegistryServants } from "@/actions/registry";
import type { RegistryServantMatch } from "@/lib/registry";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main";

export default function SmartNameInput({
  id,
  label,
  value,
  onValueChange,
  onServantSelect,
  placeholder = "اكتب الاسم أو اختر خادماً",
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onServantSelect?: (servant: RegistryServantMatch) => void;
  placeholder?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const requestId = useRef(0);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<RegistryServantMatch[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [keyboardIndex, setKeyboardIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function scheduleSearch(next: string) {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    const trimmed = next.trim();
    const currentId = requestId.current + 1;
    requestId.current = currentId;

    if (!trimmed) {
      setResults([]);
      setStatus("idle");
      setError("");
      setOpen(false);
      setKeyboardIndex(-1);
      return;
    }

    setResults([]);
    setStatus("loading");
    setError("");
    setOpen(true);
    setKeyboardIndex(-1);

    timer.current = window.setTimeout(() => {
      startTransition(() => {
        void searchRegistryServants(trimmed).then((result) => {
          if (requestId.current !== currentId) {
            return;
          }

          if (!result.success) {
            setResults([]);
            setStatus("error");
            setError(result.error);
            setKeyboardIndex(-1);
            return;
          }

          setError("");
          setResults(result.servants);
          setStatus("ready");
          setKeyboardIndex(-1);
        });
      });
    }, 250);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function update() {
      const input = rootRef.current?.querySelector("input");

      if (input) {
        setRect(input.getBoundingClientRect());
      }
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, value, results.length, status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(servant: RegistryServantMatch) {
    requestId.current += 1;

    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    setOpen(false);
    setResults([]);
    setStatus("idle");
    setError("");
    setKeyboardIndex(-1);
    onValueChange(servant.name);
    onServantSelect?.(servant);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setKeyboardIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setKeyboardIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && keyboardIndex >= 0 && results[keyboardIndex]) {
      event.preventDefault();
      choose(results[keyboardIndex]);
    }
  }

  const showList = open && rect !== null && typeof document !== "undefined";
  const openUp = rect ? window.innerHeight - rect.bottom < 220 && rect.top > 220 : false;

  return (
    <div ref={rootRef} className="block">
      <label className="block space-y-2" htmlFor={id}>
        <span className="text-sm font-bold text-deep-red">{label}</span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={keyboardIndex >= 0 ? `${listId}-${keyboardIndex}` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onValueChange(event.target.value);
            scheduleSearch(event.target.value);
          }}
          onFocus={() => {
            if (value.trim() && !open) {
              scheduleSearch(value);
            }
          }}
          onKeyDown={onKeyDown}
          className={fieldClassName}
        />
      </label>
      {showList
        ? createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              className="overflow-auto rounded-xl border border-coptic-gold-main/40 bg-white shadow-xl"
              style={{
                position: "fixed",
                top: openUp ? undefined : rect.bottom + 4,
                bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
                right: window.innerWidth - rect.right,
                width: rect.width,
                maxHeight: 240,
                zIndex: 80,
              }}
            >
              {status === "loading" ? (
                <p className="px-3 py-3 text-sm text-deep-red/70">جارٍ البحث في سجل الخدام...</p>
              ) : null}
              {status === "error" ? <p className="px-3 py-3 text-sm text-deep-red">{error}</p> : null}
              {status === "ready" && results.length === 0 ? (
                <p className="px-3 py-3 text-sm leading-6 text-deep-red/70">
                  لا يوجد خادم بهذا الاسم. يمكنك حفظ الاسم كما هو.
                </p>
              ) : null}
              {results.map((servant, index) => (
                <button
                  key={servant.id}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={keyboardIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(servant)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-right ${
                    keyboardIndex === index ? "bg-coptic-gold-main/20" : "hover:bg-cream"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-deep-red">{servant.name}</span>
                    <span className="mt-0.5 block text-xs text-coptic-gold-dark">خادم</span>
                  </span>
                  <span dir="ltr" className="shrink-0 text-sm text-deep-red/70">
                    {servant.phone || "بدون موبايل"}
                  </span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
