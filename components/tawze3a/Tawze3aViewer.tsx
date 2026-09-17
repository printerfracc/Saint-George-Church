"use client";

import { useEffect, useMemo, useState } from "react";
import { logoutServant } from "@/actions/servant-auth";

export type PublicServant = {
  id: string;
  name: string;
};

export type PublicAssignment = {
  id: string;
  servantId: string;
  servant: PublicServant;
};

export type PublicCategory = {
  id: string;
  label: string;
  roleType: string;
  order: number;
  assignments: PublicAssignment[];
};

export type PublicKhedma = {
  id: string;
  name: string;
  order: number;
  categories: PublicCategory[];
};

export type PublicTawze3a = {
  id: string;
  title: string;
  khedmat: PublicKhedma[];
};

export type MyAssignment = {
  id: string;
  categoryLabel: string;
  roleType: string;
  khedmaId: string;
  khedmaName: string;
};

function assignmentPhrase(assignment: MyAssignment) {
  const role =
    assignment.roleType === "AMEN"
      ? "أمين"
      : assignment.roleType === "NA2EB"
        ? "نائب"
        : assignment.roleType === "KHADEM"
          ? "خادم"
          : assignment.categoryLabel;

  return `${role} في خدمة ${assignment.khedmaName}`;
}

export default function Tawze3aViewer({
  publishedTawze3a,
  servantName,
  myAssignments,
  servantId,
}: {
  publishedTawze3a: PublicTawze3a;
  servantName: string;
  myAssignments: MyAssignment[];
  servantId: string;
}) {
  const defaultKhedmaId = myAssignments[0]?.khedmaId ?? "all";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedKhedmaId, setSelectedKhedmaId] = useState(defaultKhedmaId);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query]);

  const visibleKhedmat = useMemo(() => {
    const search = debouncedQuery.toLowerCase();

    return publishedTawze3a.khedmat
      .filter((khedma) => selectedKhedmaId === "all" || khedma.id === selectedKhedmaId)
      .map((khedma) => ({
        ...khedma,
        categories: khedma.categories
          .map((category) => ({
            ...category,
            assignments: search
              ? category.assignments.filter((assignment) =>
                  assignment.servant.name.toLowerCase().includes(search),
                )
              : category.assignments,
          }))
          .filter((category) => !search || category.assignments.length > 0),
      }))
      .filter((khedma) => !search || khedma.categories.length > 0);
  }, [debouncedQuery, publishedTawze3a.khedmat, selectedKhedmaId]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16 text-cream">
      <section className="rounded-2xl border border-coptic-gold-main/40 bg-gray-900 p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold text-coptic-gold-main">{publishedTawze3a.title}</p>
            <h1 className="mt-2 text-2xl font-bold text-coptic-gold-light md:text-3xl">
              أهلاً بيك يا {servantName}
            </h1>
          </div>
          <form action={logoutServant}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-coptic-gold-main/50 px-4 text-sm font-bold text-coptic-gold-main transition-colors hover:bg-coptic-gold-main hover:text-gray-950"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>

        {myAssignments.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm font-bold text-cream">أنت متسجل في:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {myAssignments.map((assignment) => (
                <span
                  key={assignment.id}
                  className="rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 py-2 text-sm font-bold text-gray-950"
                >
                  {assignmentPhrase(assignment)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-coptic-gold-main/20 bg-black/30 px-4 py-3 text-sm leading-7 text-cream/80">
            لست مسجلاً في أي خدمة في هذا التوزيع
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="block min-w-0 flex-1 text-sm font-bold text-coptic-gold-main">
            البحث عن خادم
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="اكتب اسم الخادم..."
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/30 bg-gray-900 px-4 py-3 font-normal text-cream outline-none placeholder:opacity-40 focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <label className="block text-sm font-bold text-coptic-gold-main md:w-72">
            الخدمة
            <select
              value={selectedKhedmaId}
              onChange={(event) => setSelectedKhedmaId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/30 bg-gray-900 px-4 py-3 font-normal text-cream outline-none focus:ring-2 focus:ring-coptic-gold-main"
            >
              <option value="all">جميع الخدمات</option>
              {publishedTawze3a.khedmat.map((khedma) => (
                <option key={khedma.id} value={khedma.id}>
                  {khedma.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visibleKhedmat.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-coptic-gold-main/30 px-4 py-8 text-center text-sm text-cream/70">
            لا توجد نتائج مطابقة للبحث
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {visibleKhedmat.map((khedma) => (
              <details
                key={khedma.id}
                open
                className="rounded-2xl border border-coptic-gold-main/30 bg-gray-900 p-4 open:pb-5"
              >
                <summary className="cursor-pointer list-none text-lg font-bold text-coptic-gold-light">
                  {khedma.name}
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {khedma.categories.map((category) => (
                    <article
                      key={category.id}
                      className="rounded-xl border border-coptic-gold-main/20 bg-black/30 p-4"
                    >
                      <h2 className="text-sm font-bold text-coptic-gold-main">{category.label}</h2>
                      {category.assignments.length === 0 ? (
                        <p className="mt-3 text-xs text-cream/50">لا يوجد خدام في هذا التصنيف</p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {category.assignments.map((assignment) => {
                            const isMe = assignment.servant.id === servantId;

                            return (
                              <li
                                key={assignment.id}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  isMe
                                    ? "bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark font-bold text-gray-950"
                                    : "bg-gray-950/70 text-cream"
                                }`}
                              >
                                {assignment.servant.name}
                                {isMe ? " (أنت)" : ""}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
