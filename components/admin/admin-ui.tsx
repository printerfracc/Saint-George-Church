import type { ReactNode } from "react";

export const adminActionClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold";

export const adminActionOutline = `${adminActionClass} border border-coptic-gold-main text-coptic-gold-dark`;

export const adminActionMuted = `${adminActionClass} bg-coptic-gold-main/15 text-coptic-gold-dark`;

export const adminActionGold = `${adminActionClass} bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark text-black`;

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {typeof title === "string" ? (
          <h1 className="text-2xl font-bold text-deep-red md:text-3xl">{title}</h1>
        ) : (
          title
        )}
        {description}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-8 text-center text-sm text-deep-red/70">
      {children}
    </p>
  );
}

export function AdminMobileCard({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
      {children}
    </article>
  );
}

export function AdminResponsiveTable({
  empty,
  emptyLabel,
  colSpan,
  head,
  rows,
  cards,
}: {
  empty: boolean;
  emptyLabel: string;
  colSpan: number;
  head: ReactNode;
  rows: ReactNode;
  cards: ReactNode;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {empty ? <AdminEmptyState>{emptyLabel}</AdminEmptyState> : cards}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80 md:block">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>{head}</tr>
          </thead>
          <tbody>
            {empty ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-deep-red/70">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
