import ChurchLogo from "@/components/ChurchLogo";
import JoinInviteForm from "@/components/admin/JoinInviteForm";
import { CHURCH_NAME } from "@/lib/church";
import { getInvitationStatus } from "@/lib/invite-status";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "إكمال دعوة المسؤول",
};

type JoinPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InviteError message="رابط الدعوة غير مكتمل. يرجى استخدام الرابط المرسل إليك." />;
  }

  let invite;

  try {
    invite = await prisma.inviteToken.findUnique({
      where: { token },
    });
  } catch {
    return (
      <InviteError message="تعذر التحقق من الدعوة حالياً. حاول مرة أخرى لاحقاً." />
    );
  }

  const isValid = !!invite && getInvitationStatus(invite.used, invite.expiresAt) === "active";

  if (!invite || !isValid) {
    return (
      <InviteError message="هذه الدعوة غير صالحة أو منتهية الصلاحية. اطلب دعوة جديدة من المسؤول الأعلى." />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-gold/60 bg-white/85 p-6 shadow-sm">
        <div className="mb-4 flex justify-center">
          <ChurchLogo size={96} className="h-20 w-20" />
        </div>
        <p className="mb-4 text-center text-sm font-bold text-deep-red">{CHURCH_NAME}</p>
        <div className="mb-2 h-1 w-16 rounded-full bg-gold" />
        <h1 className="text-2xl font-bold text-deep-red">إكمال التسجيل</h1>
        <p className="mt-2 text-sm leading-7 text-deep-red/75">
          أنشئ حساب المسؤول الخاص بك للوصول إلى لوحة التحكم.
        </p>
        <JoinInviteForm token={invite.token} email={invite.email} />
      </section>
    </main>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-gold bg-white/85 p-6 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <ChurchLogo size={80} className="h-16 w-16" />
        </div>
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gold" />
        <h1 className="text-2xl font-bold text-deep-red">دعوة غير صالحة</h1>
        <p className="mt-4 text-sm leading-8 text-deep-red/80">{message}</p>
      </section>
    </main>
  );
}
