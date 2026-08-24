"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Smartphone, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: true },
  });

  async function onSubmit(values: FormValues) {
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: "/dashboard",
      rememberMe: values.rememberMe ? "true" : "false",
    });

    if (!result || result.error) {
      toast.error("Sign in failed", {
        description: "Check your email and password, then try again.",
      });
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F172A] px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
      <Toaster position="top-right" richColors closeButton />

      {/* Decorative background — matches dashboard hero gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_85%_90%,_rgba(99,102,241,0.1),_transparent_45%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8"
        >
          {/* ── LOGIN CARD ── */}
          <section className="rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm sm:p-8 lg:p-10">
            {/* Brand */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-lg shadow-blue-900/20">
                <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94A3B8]">
                  Focus Fitness
                </p>
                <p className="text-sm text-[#64748B]">Management</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3B82F6]">
                Secure Access
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl">
                Welcome Back
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[#94A3B8] sm:text-base sm:leading-8">
                Sign in to continue to your Gym Dashboard.
              </p>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#F8FAFC]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="owner@gym.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="w-full rounded-xl border border-[#334155] bg-[#0F172A]/50 px-4 py-3 text-sm text-[#F8FAFC] shadow-sm outline-none transition placeholder:text-[#64748B] hover:border-[#475569] focus:border-[#3B82F6] focus:bg-[#0F172A] focus:ring-4 focus:ring-[#3B82F6]/10"
                  {...register("email")}
                />
                {errors.email ? (
                  <p id="email-error" className="text-sm font-medium text-red-400">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#F8FAFC]" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="w-full rounded-xl border border-[#334155] bg-[#0F172A]/50 px-4 py-3 pr-12 text-sm text-[#F8FAFC] shadow-sm outline-none transition placeholder:text-[#64748B] hover:border-[#475569] focus:border-[#3B82F6] focus:bg-[#0F172A] focus:ring-4 focus:ring-[#3B82F6]/10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center rounded-full px-2 text-[#64748B] transition hover:text-[#94A3B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B]"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-sm font-medium text-red-400">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2.5 text-[#94A3B8]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#334155] bg-[#0F172A] text-[#3B82F6] focus:ring-[#3B82F6]"
                    {...register("rememberMe")}
                  />
                  Remember Me
                </label>
                <Link href="#" className="font-semibold text-[#3B82F6] transition hover:text-[#60A5FA] hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={isSubmitting ? undefined : { y: -1 }}
                whileTap={isSubmitting ? undefined : { scale: 0.99 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#2563EB] hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                {isSubmitting ? "Signing in..." : "Sign In"}
              </motion.button>
            </form>
          </section>

          {/* ── INFO PANEL ── */}
          <aside className="hidden rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm lg:block lg:p-8">
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-6 lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
                  Premium Operations
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
                  Fast, secure access for front desk operations.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#94A3B8]">
                  Built for daily gym workflows with a clean, distraction-free sign-in experience.
                </p>
              </div>

              <div className="mt-10 space-y-3.5 text-sm text-[#94A3B8]">
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Secure credentials for staff access.
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <Smartphone className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Mobile-first controls for reception and operations.
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <Lock className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Role-aware access to keep your workflow protected.
                </div>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </main>
  );
}