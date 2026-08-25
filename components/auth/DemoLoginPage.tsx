"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

const DEMO_USERS = [
  {
    email: "owner@demo.local",
    password: "demo123",
    label: "Owner — full access",
  },
  {
    email: "ops@demo.local",
    password: "demo123",
    label: "Ops — orders & inventory",
  },
  {
    email: "viewer@demo.local",
    password: "demo123",
    label: "Viewer — read only",
  },
] as const;

export default function DemoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@demo.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (nextEmail: string, nextPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Invalid demo credentials. Try owner@demo.local / demo123");
        return;
      }
      router.push("/");
    } catch {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    signIn(email, password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.35),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(15,23,42,0.9),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
        <div className="max-w-xl">
          <p className="text-sm font-semibold tracking-[0.28em] text-blue-300 uppercase">
            CommerceOS
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Sign in to run your ecommerce ops
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Demo login — pick a role, enter the workspace, and keep building
            products, purchase, orders, and inventory.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-slate-400">
            <li>• Local demo auth — secure cookie-based session</li>
            <li>• Password for all demo users: demo123</li>
            <li>• Session expires in 24 hours</li>
          </ul>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use a demo account to continue
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm outline-none ring-blue-600/20 focus:ring-4"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm outline-none ring-blue-600/20 focus:ring-4"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </label>

            {error ? (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Quick demo users
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => signIn(user.email, user.password)}
                  disabled={loading}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50/60 disabled:opacity-60"
                >
                  <span>
                    <span className="block font-semibold text-slate-900">
                      {user.label}
                    </span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
