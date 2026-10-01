"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { upsertEedContent } from "@/actions/site-content";
import ImageUpload from "@/components/admin/ImageUpload";
import { AdminPageHeader, adminActionGold } from "@/components/admin/admin-ui";

export default function EedContentForm({
  goal,
  slogan,
  sloganLogo,
}: {
  goal: string;
  slogan: string;
  sloganLogo: string;
}) {
  const router = useRouter();
  const [goalValue, setGoalValue] = useState(goal);
  const [sloganValue, setSloganValue] = useState(slogan);
  const [sloganLogoValue, setSloganLogoValue] = useState(sloganLogo);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSaved(false);

    const result = await upsertEedContent({
      goal: goalValue,
      slogan: sloganValue,
      sloganLogo: sloganLogoValue,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <AdminPageHeader
        title="محتوى عيد الخدام"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/70">
            الهدف والشعار يظهران في أعلى صفحة عيد الخدام.
          </p>
        }
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="max-w-3xl space-y-5 rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm md:p-7"
      >
        <label className="block">
          <span className="text-sm font-bold text-deep-red">الهدف</span>
          <textarea
            value={goalValue}
            onChange={(event) => setGoalValue(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
            placeholder="اكتب هدف عيد الخدام"
          />
        </label>

        <ImageUpload
          value={sloganLogoValue}
          onChange={setSloganLogoValue}
          label="شعار الصورة"
          hint="صورة مربعة بنسبة 1:1. يظهر نص الشعار تحتها كوصف."
          preview="square"
        />

        <label className="block">
          <span className="text-sm font-bold text-deep-red">وصف الشعار</span>
          <textarea
            value={sloganValue}
            onChange={(event) => setSloganValue(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
            placeholder="اكتب وصف الشعار"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm font-bold text-deep-red">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm font-bold text-green-700">
            تم حفظ المحتوى
          </p>
        ) : null}

        <button type="submit" className={adminActionGold} disabled={isSaving}>
          {isSaving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
