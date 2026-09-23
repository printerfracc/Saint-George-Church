"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  SEARCH_MIN_QUERY_LENGTH,
  type SearchChild,
  type SearchResult,
} from "@/lib/search";

const TYPE_BADGE_CLASS: Record<string, string> = {
  عظة: "bg-deep-red text-cream",
  كتاب: "bg-coptic-gold-main text-black",
  صورة: "bg-coptic-gold-light text-deep-red",
  خدمة: "border border-deep-red/20 bg-deep-red/10 text-deep-red",
  قطاع: "border border-coptic-gold-main/40 bg-coptic-gold-main/15 text-coptic-gold-dark",
  كاهن: "bg-deep-red text-cream",
  خبر: "bg-coptic-gold-dark text-cream",
  رفات: "bg-black/80 text-coptic-gold-light",
  نشاط: "border border-coptic-gold-main/50 bg-cream text-deep-red",
  طقس: "bg-deep-red text-gold",
};

type DropdownRect = {
  top: number;
  left: number;
  width: number;
};

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-deep-red/20 border-t-deep-red ${className ?? "h-4 w-4"}`}
      aria-hidden="true"
    />
  );
}

function TypeBadge({ type, nested = false }: { type: string; nested?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full font-bold ${
        nested ? "px-2 py-0.5 text-[10px] opacity-90" : "px-2.5 py-0.5 text-[11px]"
      } ${
        TYPE_BADGE_CLASS[type] ??
        "border border-coptic-gold-main/40 bg-cream text-deep-red"
      }`}
    >
      {type}
    </span>
  );
}

function ResultLink({
  item,
  nested = false,
  onSelect,
}: {
  item: SearchResult | SearchChild;
  nested?: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={item.url}
      role="option"
      onClick={onSelect}
      className={
        nested
          ? "flex min-h-11 items-center justify-between gap-3 py-2.5 pe-2 ps-1 text-right transition hover:bg-white/90"
          : "flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-cream/80"
      }
    >
      <span
        className={
          nested
            ? "min-w-0 flex-1 truncate ps-1 text-sm font-normal leading-6 text-deep-red/65"
            : "min-w-0 flex-1 truncate text-base font-bold leading-7 text-deep-red"
        }
      >
        {nested ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-coptic-gold-main/70"
              aria-hidden="true"
            />
            {item.title}
          </span>
        ) : (
          item.title
        )}
      </span>
      <TypeBadge type={item.type} nested={nested} />
    </Link>
  );
}

function SearchDropdown({
  listId,
  rect,
  isLoading,
  results,
  onSelect,
}: {
  listId: string;
  rect: DropdownRect;
  isLoading: boolean;
  results: SearchResult[];
  onSelect: () => void;
}) {
  return (
    <div
      id={listId}
      role="listbox"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
      }}
      className="fixed z-[9999] max-h-[min(24rem,70vh)] overflow-y-auto rounded-lg border border-coptic-gold-main/30 bg-white/95 shadow-xl backdrop-blur-md"
    >
      {isLoading && results.length === 0 ? (
        <p className="px-4 py-3 text-sm text-deep-red/60">جاري البحث...</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-3 text-sm text-deep-red/70">لا توجد نتائج</p>
      ) : (
        <ul>
          {results.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="border-b border-coptic-gold-main/15 last:border-b-0"
            >
              <div className={item.children.length > 0 ? "bg-white" : undefined}>
                <ResultLink item={item} onSelect={onSelect} />
              </div>
              {item.children.length > 0 ? (
                <div className="mx-3 mb-3 mt-0.5 rounded-md border border-coptic-gold-main/15 bg-cream/70 ps-5 pe-2 py-1 shadow-inner border-s-[3px] border-s-coptic-gold-main/35">
                  <ul
                    role="group"
                    aria-label={`نتائج فرعية: ${item.title}`}
                    className="divide-y divide-coptic-gold-main/10"
                  >
                    {item.children.map((child) => (
                      <li key={`${child.type}-${child.id}`}>
                        <ResultLink
                          item={child}
                          nested
                          onSelect={onSelect}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GlobalSearch({
  className = "",
  placeholder = "ابحث في الموقع...",
  variant = "default",
  autoFocus = false,
  onDismiss,
  inputRef: inputRefProp,
}: {
  className?: string;
  placeholder?: string;
  variant?: "default" | "navbar";
  autoFocus?: boolean;
  onDismiss?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const listId = useId();
  const searchInputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? localInputRef;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoFocus, inputRef]);

  const showDropdown = isOpen && query.trim().length >= SEARCH_MIN_QUERY_LENGTH;

  const updateDropdownRect = () => {
    const anchor = inputWrapRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (!showDropdown) {
      setDropdownRect(null);
      return;
    }

    updateDropdownRect();

    window.addEventListener("resize", updateDropdownRect);
    window.addEventListener("scroll", updateDropdownRect, true);

    return () => {
      window.removeEventListener("resize", updateDropdownRect);
      window.removeEventListener("scroll", updateDropdownRect, true);
    };
  }, [showDropdown, query, results.length, isLoading]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }

      const listbox = document.getElementById(listId);
      if (listbox?.contains(target)) {
        return;
      }

      setIsOpen(false);
      if (onDismiss && !query.trim()) {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [listId, onDismiss, query]);

  useEffect(() => {
    const value = query.trim();

    if (value.length < SEARCH_MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setIsOpen(true);

      void fetch(`/api/search?q=${encodeURIComponent(value)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("search failed");
          }

          return (await response.json()) as SearchResult[];
        })
        .then((data) => {
          setResults(
            Array.isArray(data)
              ? data.map((item) => ({
                  ...item,
                  children: Array.isArray(item.children) ? item.children : [],
                }))
              : [],
          );
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const inputClassName =
    variant === "navbar"
      ? "w-full rounded-lg border border-coptic-gold-main/45 bg-white py-2.5 ps-10 pe-3 text-sm text-deep-red placeholder:text-deep-red/45 shadow-sm outline-none transition focus:border-coptic-gold-main focus:ring-2 focus:ring-coptic-gold-main/35"
      : "w-full rounded-xl border border-coptic-gold-main/40 bg-white py-3 ps-11 pe-4 text-sm text-deep-red placeholder:text-deep-red/40 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <label className="sr-only" htmlFor={searchInputId}>
        البحث في الموقع
      </label>
      <div ref={inputWrapRef} className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-deep-red/50">
          {isLoading ? <Spinner /> : <SearchIcon className="h-5 w-5" />}
        </span>
        <input
          id={searchInputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= SEARCH_MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          ref={inputRef}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              if (onDismiss) {
                onDismiss();
              }
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          className={inputClassName}
        />
      </div>

      {portalReady && showDropdown && dropdownRect
        ? createPortal(
            <SearchDropdown
              listId={listId}
              rect={dropdownRect}
              isLoading={isLoading}
              results={results}
              onSelect={() => setIsOpen(false)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
