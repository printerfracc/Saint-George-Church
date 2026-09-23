"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SearchIcon({ className }: { className?: string }) {
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

function SearchField({
  id,
  value,
  placeholder,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="relative mx-auto w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor={id}>
        بحث
      </label>
      <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-deep-red/50">
        <SearchIcon className="h-5 w-5" />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-coptic-gold-main/40 bg-white py-3 ps-11 pe-4 text-sm text-deep-red placeholder:text-deep-red/40 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </form>
  );
}

function LocalSearchInputInner({
  placeholder,
  paramName,
}: {
  placeholder: string;
  paramName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(urlQuery);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  const pushQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = nextValue.trim();

      if (trimmed) {
        params.set(paramName, trimmed);
      } else {
        params.delete(paramName);
      }

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      const current = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      if (href === current) {
        return;
      }

      router.push(href, { scroll: false });
    },
    [paramName, pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (value.trim() === urlQuery.trim()) {
        return;
      }

      pushQuery(value);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [pushQuery, urlQuery, value]);

  return (
    <SearchField
      id={`local-search-${paramName}`}
      value={value}
      placeholder={placeholder}
      onChange={setValue}
      onSubmit={() => pushQuery(value)}
    />
  );
}

export default function LocalSearchInput({
  placeholder = "ابحث...",
  paramName = "q",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  return (
    <Suspense
      fallback={
        <SearchField
          id="local-search-fallback"
          value=""
          placeholder={placeholder}
          onChange={() => undefined}
          onSubmit={() => undefined}
        />
      }
    >
      <LocalSearchInputInner placeholder={placeholder} paramName={paramName} />
    </Suspense>
  );
}
