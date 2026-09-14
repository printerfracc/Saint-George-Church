"use client";

import { useState } from "react";
import { submitPrayerRequest } from "@/actions/contact";

export default function PrayerRequestForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  if (status === "success") {
    return (
      <p
        role="status"
        className="rounded-2xl border border-coptic-gold-main/50 bg-white/80 px-4 py-8 text-center font-bold text-deep-red"
      >
        تم استلام طلبكم. الرب يحفظكم ويبارك حياتكم.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        setStatus("saving");
        setError("");

        void submitPrayerRequest(formData).then((result) => {
          if (!result.success) {
            setError(result.error);
            setStatus("error");
            return;
          }

          form.reset();
          setStatus("success");
        });
      }}
    >
      <label className="block space-y-2">
        <span className="text-sm font-bold text-deep-red">الاسم</span>
        <input
          required
          name="name"
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
          aria-label="الاسم"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-deep-red">الرسالة/الطلب</span>
        <textarea
          required
          name="message"
          rows={6}
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
          aria-label="الرسالة أو الطلب"
        />
      </label>
      {error ? <p className="text-sm font-bold text-coptic-gold-dark">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black disabled:opacity-60"
      >
        {status === "saving" ? "جاري الإرسال..." : "إرسال الطلب"}
      </button>
    </form>
  );
}
