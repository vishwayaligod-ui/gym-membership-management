"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Sparkles, Building2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { ownerSignupSchema, type OwnerSignupInput } from "@/lib/validations/auth";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OwnerSignupInput>({
    resolver: zodResolver(ownerSignupSchema),
    defaultValues: {
      gymName: "",
      ownerFullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: OwnerSignupInput) {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      toast.error("Signup failed", {
        description: payload.error || "Please check your details and try again.",
      });
      return;
    }

    toast.success(payload.message || "Account created successfully. Please sign in.");

    window.setTimeout(() => {
      router.replace("/login?signup=success");
    }, 1000);
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
          {/* ── SIGNUP CARD ── */}
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
                Owner Setup
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#F8FAFC] sm:text-4xl">
                Create Owner Account
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[#94A3B8] sm:text-base sm:leading-8">
                Set up your gym and owner account to continue to your dashboard.
              </p>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#F8FAFC]" htmlFor="gymName">
                  Gym Name
                </label>
                <input
                  id="gymName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Focus Fitness Studio"
                  aria-invalid={Boolean(errors.gymName)}
                  aria-describedby={errors.gymName ? "gymName-error" : undefined}
                  className="w-full rounded-xl border border-[#334155] bg-[#0F172A]/50 px-4 py-3 text-sm text-[#F8FAFC] shadow-sm outline-none transition placeholder:text-[#64748B] hover:border-[#475569] focus:border-[#3B82F6] focus:bg-[#0F172A] focus:ring-4 focus:ring-[#3B82F6]/10"
                  {...register("gymName")}
                />
                {errors.gymName ? (
                  <p id="gymName-error" className="text-sm font-medium text-red-400">
                    {errors.gymName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#F8FAFC]" htmlFor="ownerFullName">
                  Owner Full Name
                </label>
                <input
                  id="ownerFullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Rahul Verma"
                  aria-invalid={Boolean(errors.ownerFullName)}
                  aria-describedby={errors.ownerFullName ? "ownerName-error" : undefined}
                  className="w-full rounded-xl border border-[#334155] bg-[#0F172A]/50 px-4 py-3 text-sm text-[#F8FAFC] shadow-sm outline-none transition placeholder:text-[#64748B] hover:border-[#475569] focus:border-[#3B82F6] focus:bg-[#0F172A] focus:ring-4 focus:ring-[#3B82F6]/10"
                  {...register("ownerFullName")}
                />
                {errors.ownerFullName ? (
                  <p id="ownerName-error" className="text-sm font-medium text-red-400">
                    {errors.ownerFullName.message}
                  </p>
                ) : null}
              </div>

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
                    autoComplete="new-password"
                    placeholder="Create password"
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

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#F8FAFC]" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    className="w-full rounded-xl border border-[#334155] bg-[#0F172A]/50 px-4 py-3 pr-12 text-sm text-[#F8FAFC] shadow-sm outline-none transition placeholder:text-[#64748B] hover:border-[#475569] focus:border-[#3B82F6] focus:bg-[#0F172A] focus:ring-4 focus:ring-[#3B82F6]/10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center rounded-full px-2 text-[#64748B] transition hover:text-[#94A3B8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E293B]"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p id="confirm-password-error" className="text-sm font-medium text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                ) : null}
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
                {isSubmitting ? "Creating account..." : "Create Owner Account"}
              </motion.button>

              <p className="text-center text-sm text-[#94A3B8]">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#3B82F6] transition hover:text-[#60A5FA] hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </section>

          {/* ── INFO PANEL ── */}
          <aside className="hidden rounded-xl border border-[#334155] bg-[#1E293B] p-6 shadow-sm lg:block lg:p-8">
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#334155]/60 bg-[#0F172A]/50 p-6 lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
                  Owner Onboarding
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
                  Start your gym operations in minutes.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#94A3B8]">
                  Create your gym, register your owner account, and access the dashboard securely.
                </p>
              </div>

              <div className="mt-10 space-y-3.5 text-sm text-[#94A3B8]">
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <Building2 className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Owner-only account creation flow.
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Transaction-safe setup for gym and owner user.
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#334155]/60 bg-[#1E293B] px-4 py-3.5">
                  <Zap className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                  Automatic sign-in to your dashboard after setup.
                </div>
              </div>
            </div>
          </aside>
        </motion.div>
      </div>
    </main>
  );
}