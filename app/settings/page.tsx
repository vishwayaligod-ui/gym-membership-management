"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Camera, 
  Check, 
  Coins, 
  CreditCard, 
  Dumbbell, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Palette, 
  Phone, 
  Receipt, 
  Save, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  Volume2 
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { FormField } from "../components/FormField";
import { PageContainer } from "../components/PageContainer";

// Types for settings state
type GymProfile = {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  logoUrl: string | null;
};

type MembershipDefaults = {
  defaultPlan: string;
  defaultDuration: string;
  registrationFee: number;
  taxRate: number;
};

type NotificationSettings = {
  emailCheckIn: boolean;
  smsExpiry: boolean;
  whatsappReminder: boolean;
  weeklyReport: boolean;
};

type ThemeSettings = {
  accentColor: "blue" | "indigo" | "emerald" | "violet";
  layoutMode: "compact" | "cozy";
  darkMode: boolean;
};

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // Initial States (Mock data)
  const [profile, setProfile] = useState<GymProfile>({
    name: "Metric Fit Elite Studio",
    address: "4th Floor, Apex Tower, Sector 62, Noida, Uttar Pradesh - 201301",
    phone: "+91 98765 12345",
    email: "ops@metricfit.com",
    gstNumber: "09AAAAA1111A1Z1",
    logoUrl: null, // null will trigger our initials/placeholder logo UI
  });

  const [defaults, setDefaults] = useState<MembershipDefaults>({
    defaultPlan: "Platinum",
    defaultDuration: "3 Months",
    registrationFee: 1500,
    taxRate: 18,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailCheckIn: true,
    smsExpiry: true,
    whatsappReminder: true,
    weeklyReport: false,
  });

  const [theme, setTheme] = useState<ThemeSettings>({
    accentColor: "blue",
    layoutMode: "cozy",
    darkMode: false,
  });

  // Action handlers
  const handleLogoUpload = () => {
    toast.success("Gym logo uploaded successfully!", {
      description: "Mock file 'metric_fit_logo.png' set as primary branding.",
      duration: 3000,
    });
    // Toggle the placeholder to a mock initialized state
    setProfile(p => ({ ...p, logoUrl: "MF" }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!", {
        description: "All configurations updated and pushed to local instance.",
        duration: 4000,
      });
    }, 1200);
  };

  // Accent color hex/styling map
  const colorStyles = {
    blue: "bg-blue-600 focus-within:border-blue-500",
    indigo: "bg-indigo-600 focus-within:border-indigo-500",
    emerald: "bg-emerald-600 focus-within:border-emerald-500",
    violet: "bg-violet-600 focus-within:border-violet-500",
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Settings" />

      <PageContainer>
        <div className="space-y-4">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Settings</p>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <Settings className="h-3 w-3 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
            </div>
            <p className="text-sm text-slate-500">Configure corporate branding, workspace thresholds, and notification alerts</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* 1. GYM PROFILE SECTION */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Gym Profile</p>
                  <p className="text-sm text-slate-500">Branding details, registration keys, and public channels</p>
                </div>
              </div>

              {/* Logo Upload Placeholder Grid */}
              <div className="mb-6 flex flex-col items-center gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                <div className="relative group">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 transition group-hover:scale-[1.02]">
                    {profile.logoUrl ? (
                      <Dumbbell className="h-8 w-8 animate-pulse text-white" />
                    ) : (
                      "MF"
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-md transition hover:bg-slate-800"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-slate-800">Corporate Logo</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Recommended dimensions: 512x512px. Supported extensions: PNG, JPG, or SVG up to 2MB.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    Upload Logo
                  </button>
                </div>
              </div>

              {/* Profile Inputs */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Gym Name" name="gymName" required>
                  <input
                    id="gymName"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Metric Fit Studio"
                    required
                  />
                </FormField>

                <FormField label="Contact Email" name="gymEmail" required>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input
                      id="gymEmail"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="billing@gymname.com"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Contact Number" name="gymPhone" required>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input
                      id="gymPhone"
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="+91 99999 88888"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="GST Registration Number" name="gstNumber">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    <input
                      id="gstNumber"
                      type="text"
                      value={profile.gstNumber}
                      onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none uppercase placeholder:normal-case"
                      placeholder="09AAAAA1111A1Z1"
                    />
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Studio Address" name="gymAddress" required>
                    <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                      <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                      <textarea
                        id="gymAddress"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="min-h-[70px] w-full resize-none border-none bg-transparent text-sm outline-none"
                        placeholder="Floor, building, locality, state and PIN"
                        required
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 2. MEMBERSHIP DEFAULTS SECTION */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Coins className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Membership Defaults</p>
                  <p className="text-sm text-slate-500">Automated baseline fees, package structures, and taxes</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Default Plan Type" name="defaultPlan">
                  <select
                    id="defaultPlan"
                    value={defaults.defaultPlan}
                    onChange={(e) => setDefaults({ ...defaults, defaultPlan: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Platinum">Platinum (Full Access)</option>
                    <option value="Premium">Premium (Gym + Pool)</option>
                    <option value="Classic">Classic (Gym Only)</option>
                  </select>
                </FormField>

                <FormField label="Default Term Duration" name="defaultDuration">
                  <select
                    id="defaultDuration"
                    value={defaults.defaultDuration}
                    onChange={(e) => setDefaults({ ...defaults, defaultDuration: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months (Annual)</option>
                  </select>
                </FormField>

                <FormField label="One-Time Admission/Registration Fee (₹)" name="registrationFee">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <input
                      id="registrationFee"
                      type="number"
                      value={defaults.registrationFee}
                      onChange={(e) => setDefaults({ ...defaults, registrationFee: Number(e.target.value) })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="1000"
                    />
                  </div>
                </FormField>

                <FormField label="Standard CGST + SGST tax rate (%)" name="taxRate">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <input
                      id="taxRate"
                      type="number"
                      value={defaults.taxRate}
                      onChange={(e) => setDefaults({ ...defaults, taxRate: Number(e.target.value) })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="18"
                    />
                  </div>
                </FormField>
              </div>
            </section>

            {/* 3. NOTIFICATION SETTINGS SECTION */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Notifications</p>
                  <p className="text-sm text-slate-500">Automated triggers to keep members and admins in sync</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Switch Item 1 */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-3">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-800">Email Check-in Receipts</p>
                    <p className="text-xs text-slate-400">Pushes a dynamic email confirmation when a member swipes in</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, emailCheckIn: !notifications.emailCheckIn })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.emailCheckIn ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notifications.emailCheckIn ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Item 2 */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-3">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-800">Automated SMS Reminders</p>
                    <p className="text-xs text-slate-400">Sends transactional SMS notifications 7 days prior to expiry</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, smsExpiry: !notifications.smsExpiry })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.smsExpiry ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notifications.smsExpiry ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-3">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-800">WhatsApp Renewals API</p>
                    <p className="text-xs text-slate-400">Dispatches an interactive invoice and payment link on day of expiry</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, whatsappReminder: !notifications.whatsappReminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.whatsappReminder ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notifications.whatsappReminder ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Item 4 */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-3">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-800">Weekly Executive Attendance report</p>
                    <p className="text-xs text-slate-400">Emails a high-level metrics PDF compilation to gym owner on Sundays</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      notifications.weeklyReport ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notifications.weeklyReport ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* 4. THEME & INTERFACE SECTION (UI ONLY) */}
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Interface Settings</p>
                  <p className="text-sm text-slate-500">Accent themes and default viewport densities</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Accent Color Chooser */}
                <FormField label="Accent Brand Theme (UI Only)" name="accentColor">
                  <div className="grid grid-cols-4 gap-2.5 mt-1">
                    {(["blue", "indigo", "emerald", "violet"] as const).map((color) => {
                      const active = theme.accentColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setTheme({ ...theme, accentColor: color });
                            toast.success(`Theme accent set to ${color}!`);
                          }}
                          className={`relative flex h-10 items-center justify-center rounded-2xl text-white transition-all transform hover:scale-[1.03] ${colorStyles[color]} border-2 ${
                            active ? "border-slate-800 shadow-md scale-[1.02]" : "border-transparent"
                          }`}
                        >
                          <span className="capitalize text-xs font-semibold">{color}</span>
                          {active && (
                            <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-900 text-[9px]">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {/* Viewport Layout Mode */}
                <FormField label="List Layout Spacing Density" name="layoutDensity">
                  <div className="flex gap-2 mt-1">
                    {(["compact", "cozy"] as const).map((mode) => {
                      const active = theme.layoutMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTheme({ ...theme, layoutMode: mode })}
                          className={`flex-1 rounded-2xl border py-2.5 text-xs font-semibold transition-all ${
                            active
                              ? "bg-slate-950 text-white shadow-md border-slate-950"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="capitalize">{mode} mode</span>
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              </div>
            </section>

            {/* SAVE BUTTON FOOTER CARD */}
            <div className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-end">
              <button 
                type="button" 
                onClick={() => {
                  toast.info("Config resets", { description: "Reverted local input changes." });
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              >
                Reset Defaults
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-80"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Optimizing Configurations...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Configurations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
