"use client";

import { useActionState } from "react";
import { acceptInvite, type AcceptInviteState } from "@/actions/accept-invite";

const initialState: AcceptInviteState = {};

export default function JoinInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, formAction, isPending] = useActionState(
    acceptInvite,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />

      <p className="rounded-xl bg-cream px-4 py-3 text-sm text-deep-red">
        سيتم إنشاء الحساب على البريد: <strong>{email}</strong>
      </p>

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-bold">
          الاسم
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-bold">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold">
          تأكيد كلمة المرور
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-coptic-gold-dark">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark py-3 text-sm font-bold text-black disabled:opacity-60"
      >
        {isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب المسؤول"}
      </button>
    </form>
  );
}
