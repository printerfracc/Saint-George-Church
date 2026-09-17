import { redirect } from "next/navigation";
import InviteAdminForm from "@/components/admin/InviteAdminForm";
import InvitationsTable from "@/components/admin/InvitationsTable";
import { getRequestAppUrl } from "@/lib/request-app-url";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-admin";

export const metadata = {
  title: "دعوات المسؤولين",
};

export default async function InvitationsPage() {
  const session = await requireSuperAdmin();

  if (!session) {
    redirect("/admin");
  }

  let invitations: Awaited<ReturnType<typeof prisma.inviteToken.findMany>> = [];

  try {
    invitations = await prisma.inviteToken.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    invitations = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-deep-red md:text-3xl">دعوات المسؤولين</h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-deep-red/75">
        أرسل دعوة بالبريد، وإن تعذر الإرسال استخدم رابط واتساب من الجدول.
      </p>

      <InviteAdminForm />

      <section className="mt-8" aria-label="الدعوات السابقة">
        <h2 className="mb-4 text-xl font-bold text-deep-red">الدعوات السابقة</h2>
        <InvitationsTable
          appUrl={await getRequestAppUrl()}
          invitations={invitations.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            token: invitation.token,
            createdAt: invitation.createdAt.toISOString(),
            expiresAt: invitation.expiresAt.toISOString(),
            used: invitation.used,
            role: invitation.role,
          }))}
        />
      </section>
    </main>
  );
}
