"use client";

import { useState } from "react";
import ChurchLogo from "@/components/ChurchLogo";
import { loginServant } from "@/actions/servant-auth";
import { CHURCH_NAME } from "@/lib/church";

export default function ServantLoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await loginServant(new FormData(event.currentTarget));

    if ("error" in result) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    window.location.assign("/tawze3a");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pt-28 pb-16 text-cream">
      <section className="rounded-2xl border border-coptic-gold-main/40 bg-gray-900 p-6 text-center shadow-2xl">
        <div className="mb-4 flex justify-center">
          <span className="overflow-hidden rounded-xl bg-cream">
            <ChurchLogo size={96} className="h-20 w-20" />
          </span>
        </div>
        <p className="mb-2 text-sm font-bold text-coptic-gold-main">{CHURCH_NAME}</p>
        <h1 className="text-2xl font-bold text-coptic-gold-light">دخول الخدام</h1>
        <div className="mx-auto mt-3 w-16 border-b-4 border-coptic-gold-main" />
        <p className="mt-4 text-sm leading-7 text-cream/75">
          أدخل رقم الموبايل وآخر 4 أرقام من الرقم القومي لعرض عيد الخدام.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-right">
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold text-coptic-gold-main">
              رقم الموبايل
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              placeholder="01xxxxxxxxx"
              autoComplete="tel"
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-gray-950 px-4 py-3 text-cream outline-none placeholder:opacity-40 focus:ring-2 focus:ring-coptic-gold-main"
            />
          </div>

          <div>
            <label
              htmlFor="nationalIdLast4"
              className="mb-2 block text-sm font-bold text-coptic-gold-main"
            >
              آخر 4 أرقام من الرقم القومي
            </label>
            <input
              id="nationalIdLast4"
              name="nationalIdLast4"
              type="password"
              inputMode="numeric"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              autoComplete="off"
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-gray-950 px-4 py-3 text-center tracking-[0.4em] text-cream outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark py-3 text-sm font-bold text-black disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
                  aria-hidden="true"
                />
                جاري التحقق...
              </>
            ) : (
              "دخول"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
