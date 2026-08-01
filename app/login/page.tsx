"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: true },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setSubmitError("Invalid email or password.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fe] px-4 py-10 text-slate-900 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(66,133,244,0.22),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(52,168,83,0.18),transparent_38%),radial-gradient(circle_at_80%_85%,rgba(234,67,53,0.16),transparent_35%),radial-gradient(circle_at_15%_85%,rgba(251,188,5,0.18),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-7 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/85 p-7 shadow-[0_40px_120px_rgba(66,133,244,0.20)] backdrop-blur-xl sm:p-10">
            <p className="text-sm font-semibold tracking-[0.24em] text-slate-500">AI-Powered Operations</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gemini: <span className="text-transparent bg-gradient-to-r from-[#4285f4] via-[#34a853] to-[#ea4335] bg-clip-text">Sign In</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
              Continue to your gym command center with real-time insights, member intelligence, and secure staff access.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@gym.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#4285f4] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  {...register("email")}
                />
                {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#4285f4] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#4285f4] focus:ring-blue-500"
                    {...register("rememberMe")}
                  />
                  Remember me
                </label>
                <Link href="#" className="font-medium text-[#4285f4] transition hover:text-[#3367d6]">
                  Forgot password?
                </Link>
              </div>

              {submitError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{submitError}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4285f4] via-[#34a853] to-[#ea4335] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(66,133,244,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-7 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Why teams choose this</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Premium gym management with AI clarity</h2>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">Unified members, payments, renewals, and attendance in one flow.</li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">Role-safe login with secure credentials for staff operations.</li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">Designed for high-speed front desk and mobile-first management.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
