type ScheduleItem = {
  id: string;
  title: string;
  detail: string | null;
};

export default function LiturgyScheduleTable({ items }: { items: ScheduleItem[] }) {
  const showTitle = items.some((item) => item.title.trim());
  const showDetail = items.some((item) => item.detail?.trim());

  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/85 shadow-sm">
      <table className="min-w-full text-right text-sm">
        <thead className="bg-gray-900 text-coptic-gold-main">
          <tr>
            {showTitle ? <th className="px-4 py-3 font-bold">القداس / الصلاة</th> : null}
            {showDetail ? <th className="px-4 py-3 font-bold">الموعد</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-coptic-gold-main/20">
              {showTitle ? (
                <td className="px-4 py-3 font-bold text-deep-red">
                  {item.title.trim() || "—"}
                </td>
              ) : null}
              {showDetail ? (
                <td className="px-4 py-3 font-bold text-coptic-gold-dark">
                  {item.detail?.trim() || "—"}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
