import { listPrayerRequests } from "@/actions/contact";
import { AdminEmptyState, AdminMobileCard } from "@/components/admin/admin-ui";
import { formatAdminDate } from "@/lib/admin-labels";

export const metadata = {
  title: "طلبات الصلاة والافتقاد",
};

export default async function AdminPrayerRequestsPage() {
  let requests: Awaited<ReturnType<typeof listPrayerRequests>> = [];

  try {
    requests = await listPrayerRequests();
  } catch {
    requests = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-deep-red md:text-3xl">
        طلبات الصلاة والافتقاد
      </h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-coptic-gold-dark/80">
        الطلبات المرسلة من صفحة تواصل معنا، مرتبة من الأحدث إلى الأقدم.
      </p>

      {requests.length === 0 ? (
        <AdminEmptyState>لا توجد طلبات بعد.</AdminEmptyState>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {requests.map((request) => (
              <AdminMobileCard key={request.id}>
                <p className="text-xs font-bold text-coptic-gold-dark">
                  {formatAdminDate(request.createdAt)}
                </p>
                <p className="mt-1 font-bold text-deep-red">{request.name}</p>
                <p className="mt-2 leading-7 text-deep-red/85">{request.message}</p>
              </AdminMobileCard>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80 md:block">
            <table className="min-w-full text-right text-sm">
              <caption className="sr-only">قائمة طلبات الصلاة والافتقاد</caption>
              <thead className="bg-gray-900 text-coptic-gold-main">
                <tr>
                  <th className="px-4 py-3">التاريخ</th>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-coptic-gold-main/20 align-top"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-deep-red">
                      {formatAdminDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-bold text-deep-red">
                      {request.name}
                    </td>
                    <td className="px-4 py-3 leading-7 text-deep-red/85">
                      {request.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
