"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteAdmin } from "@/actions/invite-admin";

export default function InviteAdminForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setInviteUrl("");
    setIsError(false);

    const result = await inviteAdmin(email);

    setIsSubmitting(false);

    if (!result.success) {
      setIsError(true);
      setMessage(result.error);
      return;
    }

    setEmail("");
    setInviteUrl(result.inviteUrl);
    setMessage(
      result.emailSent
        ? "تم إرسال الدعوة بالبريد الإلكتروني بنجاح"
        : "تعذر إرسال البريد. استخدم الرابط أو واتساب لإكمال الدعوة",
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gold/50 bg-white/80 p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-deep-red">إرسال دعوة جديدة</h2>
      <p className="mt-2 text-sm leading-7 text-deep-red/75">
        أدخل بريد المسؤول الجديد. سيتم إنشاء رابط صالح لمدة 48 ساعة.
      </p>

      <label className="mt-4 block text-sm font-bold text-deep-red" htmlFor="invite-email">
        البريد الإلكتروني
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "جاري الإرسال..." : "إرسال دعوة مسؤول"}
        </button>
      </div>

      {message ? (
        <div
          role="status"
          className={`mt-3 text-sm font-medium ${isError ? "text-coptic-gold-dark" : "text-green-700"}`}
        >
          <p>{message}</p>
          {inviteUrl ? (
            <p className="mt-2 break-all text-deep-red/80" dir="ltr">
              {inviteUrl}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
