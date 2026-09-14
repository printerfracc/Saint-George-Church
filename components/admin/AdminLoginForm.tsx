"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    window.location.href = result.url ?? "/admin";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-right">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-bold text-coptic-gold-dark"
        >
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-bold text-coptic-gold-dark"
        >
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl border border-coptic-gold-main/40 bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-coptic-gold-dark">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark py-3 text-sm font-bold text-black disabled:opacity-60"
      >
        {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
