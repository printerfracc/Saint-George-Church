"use client";

import { useEffect, useMemo, useState } from "react";
import { logoutServant } from "@/actions/servant-auth";
import EedContentBanner from "@/components/tawze3a/EedContentBanner";
import { normalizeArabic } from "@/lib/arabicNormalizer";
import {
  amanatElKhedmaRoleOrder,
  isAmanatElKhedma,
  isAmenRole,
  roleDisplayIndex,
} from "@/lib/servant-role-order";

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
  roleName: string;
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
  roleName: string;
  khedmaId: string;
  khedmaName: string;
};

export type HistoryAssignment = {
  id: string;
  year: number;
  roleName: string;
  khedmaName: string;
};

function assignmentPhrase(khedmaName: string, roles: string[]) {
  const roleLabel = roles.filter(Boolean).join("، ");
  return roleLabel ? `${roleLabel} في خدمة ${khedmaName}` : khedmaName;
}

function groupMyAssignments(assignments: MyAssignment[]) {
  const groups = new Map<string, { khedmaId: string; khedmaName: string; roles: string[] }>();

  for (const assignment of assignments) {
    const current = groups.get(assignment.khedmaId) ?? {
      khedmaId: assignment.khedmaId,
      khedmaName: assignment.khedmaName,
      roles: [],
    };

    if (assignment.roleName && !current.roles.includes(assignment.roleName)) {
      current.roles.push(assignment.roleName);
    }

    groups.set(assignment.khedmaId, current);
  }

  return [...groups.values()];
}

function groupHistory(assignments: HistoryAssignment[]) {
  const groups = new Map<string, { id: string; khedmaName: string; roles: string[] }>();

  for (const assignment of assignments) {
    const current = groups.get(assignment.khedmaName) ?? {
      id: assignment.id,
      khedmaName: assignment.khedmaName,
      roles: [],
    };

    if (assignment.roleName && !current.roles.includes(assignment.roleName)) {
      current.roles.push(assignment.roleName);
    }

    groups.set(assignment.khedmaName, current);
  }

  return [...groups.values()];
}

type KhedmaServant = {
  id: string;
  servantId: string;
  name: string;
  roleName: string;
};

type KhedmaRoleCard = {
  id: string;
  roleName: string;
  people: KhedmaServant[];
};

function servantsInKhedma(khedma: PublicKhedma) {
  return khedma.categories
    .flatMap((category) => {
      const roleName = category.roleName || category.label;

      return category.assignments.map((assignment) => ({
        id: assignment.id,
        servantId: assignment.servant.id,
        name: assignment.servant.name,
        roleName,
      }));
    })
    .sort((left, right) => {
      const byRole = roleDisplayIndex(left.roleName) - roleDisplayIndex(right.roleName);

      if (byRole !== 0) {
        return byRole;
      }

      return left.name.localeCompare(right.name, "ar");
    });
}

function roleCardsForKhedma(khedma: PublicKhedma): KhedmaRoleCard[] {
  const servants = servantsInKhedma(khedma);

  if (!isAmanatElKhedma(khedma.name)) {
    return servants.map((servant) => ({
      id: servant.id,
      roleName: servant.roleName,
      people: [servant],
    }));
  }

  const groups = new Map<string, KhedmaRoleCard>();

  for (const servant of servants) {
    const current = groups.get(servant.roleName) ?? {
      id: servant.roleName,
      roleName: servant.roleName,
      people: [],
    };

    current.people.push(servant);
    groups.set(servant.roleName, current);
  }

  return [...groups.values()]
    .map((card) => ({
      ...card,
      people: [...card.people].sort((left, right) => left.name.localeCompare(right.name, "ar")),
    }))
    .sort(
      (left, right) =>
        amanatElKhedmaRoleOrder(left.roleName) - amanatElKhedmaRoleOrder(right.roleName),
    );
}

export type EedBanner = {
  goal: string | null;
  slogan: string | null;
  sloganLogo: string | null;
};

export default function Tawze3aViewer({
  publishedTawze3a,
  servantName,
  unassigned = false,
  myAssignments,
  history,
  activeYear,
  servantId,
  banner,
}: {
  publishedTawze3a: PublicTawze3a;
  servantName: string;
  unassigned?: boolean;
  myAssignments: MyAssignment[];
  history: HistoryAssignment[];
  activeYear: number;
  servantId: string;
  banner?: EedBanner | null;
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

  const historyByYear = useMemo(() => {
    const groups = new Map<number, HistoryAssignment[]>();

    for (const assignment of history) {
      const items = groups.get(assignment.year) ?? [];
      items.push(assignment);
      groups.set(assignment.year, items);
    }

    return [...groups.entries()];
  }, [history]);

  const visibleKhedmat = useMemo(() => {
    const search = normalizeArabic(debouncedQuery);
    const scopedKhedmat = publishedTawze3a.khedmat.filter(
      (khedma) => selectedKhedmaId === "all" || khedma.id === selectedKhedmaId,
    );

    if (!search) {
      return scopedKhedmat;
    }

    return publishedTawze3a.khedmat
      .map((khedma) => ({
        ...khedma,
        categories: khedma.categories
          .map((category) => ({
            ...category,
            assignments: category.assignments.filter((assignment) =>
              normalizeArabic(assignment.servant.name).includes(search),
            ),
          }))
          .filter((category) => category.assignments.length > 0),
      }))
      .filter((khedma) => khedma.categories.length > 0);
  }, [debouncedQuery, publishedTawze3a.khedmat, selectedKhedmaId]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-16 text-cream">
      <EedContentBanner
        goal={banner?.goal}
        slogan={banner?.slogan}
        sloganLogo={banner?.sloganLogo}
      />
      <section className="rounded-2xl border border-coptic-gold-main/40 bg-gray-900 p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold text-coptic-gold-main">
              عيد الخدام — {activeYear}
            </p>
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
              {groupMyAssignments(myAssignments).map((assignment) => (
                <span
                  key={assignment.khedmaId}
                  className="rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 py-2 text-sm font-bold text-gray-950"
                >
                  {assignmentPhrase(assignment.khedmaName, assignment.roles)}
                </span>
              ))}
            </div>
          </div>
        ) : unassigned ? (
          <div className="mt-6 rounded-2xl border border-coptic-gold-main/40 bg-black/30 px-5 py-4">
            <p className="text-base font-bold leading-8 text-coptic-gold-light">
              مرحباً بك {servantName}
            </p>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-coptic-gold-main/20 bg-black/30 px-4 py-3 text-sm leading-7 text-cream/80">
            لست مسجلاً في أي خدمة في هذا التوزيع
          </p>
        )}

        <div className="mt-6 border-t border-coptic-gold-main/20 pt-6">
          <h2 className="text-sm font-bold text-cream">سجل الخدمات</h2>
          {historyByYear.length === 0 ? (
            <p className="mt-3 text-sm leading-7 text-cream/70">لا يوجد سجل خدمات منشور بعد.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {historyByYear.map(([year, assignments]) => (
                <div key={year}>
                  <p className="text-sm font-bold text-coptic-gold-main">{year}</p>
                  <ul className="mt-2 space-y-2">
                    {groupHistory(assignments).map((assignment) => (
                      <li
                        key={assignment.id}
                        className="rounded-xl border border-coptic-gold-main/20 bg-black/30 px-4 py-2 text-sm text-cream"
                      >
                        {assignmentPhrase(assignment.khedmaName, assignment.roles)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
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
                key={`${khedma.id}-${debouncedQuery ? "search" : "browse"}`}
                open
                className="rounded-2xl border border-coptic-gold-main/30 bg-gray-900 p-4 open:pb-5"
              >
                <summary className="cursor-pointer list-none text-lg font-bold text-coptic-gold-light">
                  {khedma.name}
                </summary>
                <div className="mt-4">
                  {roleCardsForKhedma(khedma).length === 0 ? (
                    <p className="text-xs text-cream/50">لا يوجد خدام في هذه الخدمة</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {roleCardsForKhedma(khedma).map((card) => {
                        const solo = card.people.length === 1 ? card.people[0] : undefined;
                        const isMe = Boolean(solo && solo.servantId === servantId);
                        const amen = isAmanatElKhedma(khedma.name)
                          ? amanatElKhedmaRoleOrder(card.roleName) === 0
                          : isAmenRole(card.roleName);

                        return (
                          <li
                            key={card.id}
                            className={`flex flex-col rounded-lg px-3 py-2 text-sm ${
                              isMe
                                ? "bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark font-bold text-gray-950"
                                : "bg-gray-950/70 text-cream"
                            }`}
                          >
                            {card.roleName ? (
                              <span
                                className={`mb-1.5 w-fit rounded-full px-2 py-0.5 text-xs font-bold ${
                                  isMe
                                    ? "bg-gray-950/15 text-gray-950"
                                    : "bg-coptic-gold-main/15 text-coptic-gold-light"
                                }`}
                              >
                                {card.roleName}
                              </span>
                            ) : null}
                            <div className="flex flex-col gap-1">
                              {card.people.map((servant) => {
                                const personIsMe = servant.servantId === servantId;

                                return (
                                  <span
                                    key={servant.id}
                                    className={
                                      amen && !personIsMe
                                        ? "text-base font-bold text-coptic-gold-light"
                                        : undefined
                                    }
                                  >
                                    {servant.name}
                                    {personIsMe ? " (أنت)" : ""}
                                  </span>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
