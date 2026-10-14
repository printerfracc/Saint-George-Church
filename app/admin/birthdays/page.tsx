export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import BirthdaysClientView from "@/components/admin/BirthdaysClientView";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { authOptions } from "@/lib/auth";
import type { BirthdayServant } from "@/lib/birthdays";
import { decryptData } from "@/lib/crypto";
import { parseNationalId } from "@/lib/national-id";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "أعياد الميلاد",
};

function decryptField(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decryptData(value);
  } catch {
    return null;
  }
}

export default async function BirthdaysPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TAWZE3A_ADMIN") {
    redirect("/admin");
  }

  const servants = await prisma.servant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      encryptedPhone: true,
      encryptedNationalId: true,
    },
  });

  const birthdays: BirthdayServant[] = [];

  for (const servant of servants) {
    const nationalId = decryptField(servant.encryptedNationalId);
    const parsed = nationalId ? parseNationalId(nationalId) : null;

    if (!parsed?.dateOfBirth || parsed.age == null) {
      continue;
    }

    birthdays.push({
      id: servant.id,
      name: servant.name,
      phone: decryptField(servant.encryptedPhone),
      nationalId,
      age: parsed.age,
      birthYear: parsed.dateOfBirth.getFullYear(),
      birthMonth: parsed.dateOfBirth.getMonth() + 1,
      birthDay: parsed.dateOfBirth.getDate(),
    });
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <AdminPageHeader
        title="أعياد الميلاد"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/75">
            أعياد ميلاد الخدام المستخرجة من الرقم القومي، لليوم والثلاثين يوماً القادمة والثلاثين يوماً السابقة.
          </p>
        }
      />
      <BirthdaysClientView servants={birthdays} />
    </main>
  );
}
