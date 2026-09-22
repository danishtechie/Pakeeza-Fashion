"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(
        res.error === "ACCOUNT_LOCKED"
          ? "Too many failed attempts. This account is temporarily locked — try again later."
          : "Invalid email or password."
      );
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3efe9] px-4">
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full border border-gold/25" />
      <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full border border-forest-light/25" />
      <div className="relative w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-8 shadow-2xl shadow-charcoal/10 sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-ivory shadow-lg"><Lock size={20} /></div>
          <p className="eyebrow mt-2">Store operations</p>
          <h1 className="font-display text-3xl tracking-tight">Pakeeza Fashion</h1>
          <p className="text-sm text-charcoal/50">Sign in to manage your store</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-charcoal/70">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-charcoal/20 px-3.5 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-charcoal/70">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-charcoal/20 px-3.5 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
          {error && <p className="text-sm text-burgundy">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-charcoal py-3 text-sm text-ivory transition hover:bg-forest disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
