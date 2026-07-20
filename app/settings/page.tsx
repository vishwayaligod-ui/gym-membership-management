"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Globe,
  Key,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Palette,
  Phone,
  Receipt,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  Timer,
  Wallet,
  Zap,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { FormField } from "../components/FormField";
import { PageContainer } from "../components/PageContainer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GymInfo = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  logoUrl: string | null;
};

type BusinessSettings = {
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
};

type MembershipSettings = {
  defaultDuration: string;
  gracePeriod: number;
  renewalReminderDays: number;
  allowFreeze: boolean;
  allowGuestPass: boolean;
};

type PaymentSettings = {
  acceptedMethods: string[];
  taxPercentage: number;
  lateFee: number;
  autoGenerateReceipt: boolean;
};

type NotificationSettings = {
  whatsappReminder: boolean;
  smsReminder: boolean;
  emailReminder: boolean;
  birthdayWishes: boolean;
  renewalReminder: boolean;
};

type SecuritySettings = {
  twoFactorAuth: boolean;
};

type AppearanceSettings = {
  theme: "light" | "dark";
  primaryColor: string;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const paymentMethodOptions = [
  { id: "upi", label: "UPI" },
  { id: "credit-card", label: "Credit Card" },
  { id: "debit-card", label: "Debit Card" },
  { id: "cash", label: "Cash" },
  { id: "net-banking", label: "Net Banking" },
];

const colorOptions = [
  { value: "blue", label: "Blue", class: "bg-blue-600" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-600" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-600" },
  { value: "violet", label: "Violet", class: "bg-violet-600" },
  { value: "rose", label: "Rose", class: "bg-rose-600" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
];

// ---------------------------------------------------------------------------
// ToggleSwitch reusable component
// ---------------------------------------------------------------------------

function ToggleSwitch({
  enabled,
  onChange,
  id,
}: {
  enabled: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
        enabled ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// SectionCard reusable wrapper
// ---------------------------------------------------------------------------

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="rounded-2xl bg-blue-600/10 p-2 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  // 1. Gym Information
  const [gymInfo, setGymInfo] = useState<GymInfo>({
    name: "Metric Fit Elite Studio",
    ownerName: "Rahul Verma",
    email: "ops@metricfit.com",
    phone: "+91 98765 12345",
    address: "4th Floor, Apex Tower, Sector 62, Noida, Uttar Pradesh - 201301",
    gstNumber: "09AAAAA1111A1Z1",
    logoUrl: null,
  });

  // 2. Business Settings
  const [business, setBusiness] = useState<BusinessSettings>({
    currency: "INR (₹)",
    timezone: "Asia/Kolkata (IST)",
    dateFormat: "DD/MM/YYYY",
    language: "English",
  });

  // 3. Membership Settings
  const [membership, setMembership] = useState<MembershipSettings>({
    defaultDuration: "3 Months",
    gracePeriod: 7,
    renewalReminderDays: 7,
    allowFreeze: true,
    allowGuestPass: false,
  });

  // 4. Payment Settings
  const [payment, setPayment] = useState<PaymentSettings>({
    acceptedMethods: ["upi", "credit-card", "debit-card", "cash"],
    taxPercentage: 18,
    lateFee: 100,
    autoGenerateReceipt: true,
  });

  // 5. Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    whatsappReminder: true,
    smsReminder: true,
    emailReminder: true,
    birthdayWishes: true,
    renewalReminder: false,
  });

  // 6. Security
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
  });

  // 7. Appearance
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: "light",
    primaryColor: "blue",
  });

  // Handlers
  const handleLogoUpload = () => {
    toast.success("Gym logo uploaded successfully!", {
      description: "Logo has been set as primary branding.",
      duration: 3000,
    });
    setGymInfo((p) => ({ ...p, logoUrl: "MF" }));
  };

  const togglePaymentMethod = (methodId: string) => {
    setPayment((prev) => ({
      ...prev,
      acceptedMethods: prev.acceptedMethods.includes(methodId)
        ? prev.acceptedMethods.filter((m) => m !== methodId)
        : [...prev.acceptedMethods, methodId],
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!", {
        description: "All configurations have been updated.",
        duration: 4000,
      });
    }, 1200);
  };

  const handleLogout = () => {
    toast.success("Logged out successfully!", {
      description: "You have been signed out of your account.",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <Toaster position="top-right" richColors closeButton />
      <AppHeader title="Settings" />

      <PageContainer>
        <div className="space-y-4 pb-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                Settings
              </p>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <Settings
                  className="h-3 w-3 animate-spin"
                  style={{ animationDuration: "12s" }}
                />
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage gym profile, memberships, payments, notifications, and more
            </p>
          </motion.div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* ================================================================ */}
            {/* 1. GYM INFORMATION                                               */}
            {/* ================================================================ */}
            <SectionCard icon={Building2} title="Gym Information" subtitle="Branding, contact details, and registration info" delay={0.02}>
              {/* Logo Upload */}
              <div className="mb-6 flex flex-col items-center gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                <div className="relative group">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 transition group-hover:scale-[1.02]">
                    {gymInfo.logoUrl ? (
                      <Dumbbell className="h-8 w-8 text-white" />
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
                  <p className="text-sm font-semibold text-slate-800">Gym Logo</p>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Recommended: 512x512px. PNG, JPG, or SVG up to 2MB.
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

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Gym Name" name="gymName" required>
                  <input
                    id="gymName"
                    type="text"
                    value={gymInfo.name}
                    onChange={(e) => setGymInfo({ ...gymInfo, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Metric Fit Studio"
                    required
                  />
                </FormField>

                <FormField label="Owner Name" name="ownerName" required>
                  <input
                    id="ownerName"
                    type="text"
                    value={gymInfo.ownerName}
                    onChange={(e) => setGymInfo({ ...gymInfo, ownerName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Rahul Verma"
                    required
                  />
                </FormField>

                <FormField label="Email" name="gymEmail" required>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      id="gymEmail"
                      type="email"
                      value={gymInfo.email}
                      onChange={(e) => setGymInfo({ ...gymInfo, email: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="billing@gymname.com"
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Phone Number" name="gymPhone" required>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      id="gymPhone"
                      type="text"
                      value={gymInfo.phone}
                      onChange={(e) => setGymInfo({ ...gymInfo, phone: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="+91 99999 88888"
                      required
                    />
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Address" name="gymAddress" required>
                    <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <textarea
                        id="gymAddress"
                        value={gymInfo.address}
                        onChange={(e) => setGymInfo({ ...gymInfo, address: e.target.value })}
                        className="min-h-[70px] w-full resize-none border-none bg-transparent text-sm outline-none"
                        placeholder="Full address"
                        required
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="GST Number (Optional)" name="gstNumber">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <Receipt className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      id="gstNumber"
                      type="text"
                      value={gymInfo.gstNumber}
                      onChange={(e) => setGymInfo({ ...gymInfo, gstNumber: e.target.value })}
                      className="w-full border-none bg-transparent text-sm outline-none uppercase placeholder:normal-case"
                      placeholder="09AAAAA1111A1Z1"
                    />
                  </div>
                </FormField>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 2. BUSINESS SETTINGS                                             */}
            {/* ================================================================ */}
            <SectionCard icon={Globe} title="Business Settings" subtitle="Currency, timezone, date format, and language preferences" delay={0.04}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Currency" name="currency">
                  <select
                    id="currency"
                    value={business.currency}
                    onChange={(e) => setBusiness({ ...business, currency: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                  </select>
                </FormField>

                <FormField label="Timezone" name="timezone">
                  <select
                    id="timezone"
                    value={business.timezone}
                    onChange={(e) => setBusiness({ ...business, timezone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </FormField>

                <FormField label="Date Format" name="dateFormat">
                  <select
                    id="dateFormat"
                    value={business.dateFormat}
                    onChange={(e) => setBusiness({ ...business, dateFormat: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </FormField>

                <FormField label="Language" name="language">
                  <select
                    id="language"
                    value={business.language}
                    onChange={(e) => setBusiness({ ...business, language: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                  </select>
                </FormField>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 3. MEMBERSHIP SETTINGS                                           */}
            {/* ================================================================ */}
            <SectionCard icon={Timer} title="Membership Settings" subtitle="Duration, grace period, and member privileges" delay={0.06}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Default Membership Duration" name="defaultDuration">
                  <select
                    id="defaultDuration"
                    value={membership.defaultDuration}
                    onChange={(e) => setMembership({ ...membership, defaultDuration: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months (Annual)</option>
                  </select>
                </FormField>

                <FormField label="Grace Period (Days)" name="gracePeriod">
                  <input
                    id="gracePeriod"
                    type="number"
                    value={membership.gracePeriod}
                    onChange={(e) => setMembership({ ...membership, gracePeriod: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="7"
                    min={0}
                    max={30}
                  />
                </FormField>

                <FormField label="Renewal Reminder (Days Before)" name="renewalReminderDays">
                  <input
                    id="renewalReminderDays"
                    type="number"
                    value={membership.renewalReminderDays}
                    onChange={(e) => setMembership({ ...membership, renewalReminderDays: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="7"
                    min={1}
                    max={60}
                  />
                </FormField>

                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-slate-800">Allow Freeze Membership</p>
                      <p className="text-xs text-slate-500">Members can freeze their membership for a limited period</p>
                    </div>
                    <ToggleSwitch
                      id="allowFreeze"
                      enabled={membership.allowFreeze}
                      onChange={() => setMembership({ ...membership, allowFreeze: !membership.allowFreeze })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-slate-800">Allow Guest Pass</p>
                      <p className="text-xs text-slate-500">Members can bring guests with a day pass</p>
                    </div>
                    <ToggleSwitch
                      id="allowGuestPass"
                      enabled={membership.allowGuestPass}
                      onChange={() => setMembership({ ...membership, allowGuestPass: !membership.allowGuestPass })}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 4. PAYMENT SETTINGS                                              */}
            {/* ================================================================ */}
            <SectionCard icon={Wallet} title="Payment Settings" subtitle="Payment methods, tax, late fees, and receipts" delay={0.08}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Accepted Payment Methods */}
                <div className="md:col-span-2">
                  <FormField label="Accepted Payment Methods" name="paymentMethods">
                    <div className="mt-1 flex flex-wrap gap-2">
                      {paymentMethodOptions.map((method) => {
                        const selected = payment.acceptedMethods.includes(method.id);
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => togglePaymentMethod(method.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                              selected
                                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </div>

                <FormField label="Tax Percentage (%)" name="taxPercentage">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      id="taxPercentage"
                      type="number"
                      value={payment.taxPercentage}
                      onChange={(e) => setPayment({ ...payment, taxPercentage: Number(e.target.value) })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="18"
                      min={0}
                      max={100}
                    />
                  </div>
                </FormField>

                <FormField label="Late Fee (₹)" name="lateFee">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white">
                    <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      id="lateFee"
                      type="number"
                      value={payment.lateFee}
                      onChange={(e) => setPayment({ ...payment, lateFee: Number(e.target.value) })}
                      className="w-full border-none bg-transparent text-sm outline-none"
                      placeholder="100"
                      min={0}
                    />
                  </div>
                </FormField>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="pr-4">
                      <p className="text-sm font-semibold text-slate-800">Auto Generate Receipt</p>
                      <p className="text-xs text-slate-500">Automatically generate and send receipts for payments</p>
                    </div>
                    <ToggleSwitch
                      id="autoGenerateReceipt"
                      enabled={payment.autoGenerateReceipt}
                      onChange={() => setPayment({ ...payment, autoGenerateReceipt: !payment.autoGenerateReceipt })}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 5. NOTIFICATION SETTINGS                                         */}
            {/* ================================================================ */}
            <SectionCard icon={Bell} title="Notification Settings" subtitle="Configure communication channels and alerts" delay={0.10}>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-green-50 p-2 text-green-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">WhatsApp Reminder</p>
                      <p className="text-xs text-slate-500">Send renewal reminders via WhatsApp</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="whatsappReminder"
                    enabled={notifications.whatsappReminder}
                    onChange={() => setNotifications({ ...notifications, whatsappReminder: !notifications.whatsappReminder })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">SMS Reminder</p>
                      <p className="text-xs text-slate-500">Send SMS notifications for upcoming renewals</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="smsReminder"
                    enabled={notifications.smsReminder}
                    onChange={() => setNotifications({ ...notifications, smsReminder: !notifications.smsReminder })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Email Reminder</p>
                      <p className="text-xs text-slate-500">Send email notifications for renewals and updates</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="emailReminder"
                    enabled={notifications.emailReminder}
                    onChange={() => setNotifications({ ...notifications, emailReminder: !notifications.emailReminder })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Birthday Wishes</p>
                      <p className="text-xs text-slate-500">Send automated birthday greetings to members</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="birthdayWishes"
                    enabled={notifications.birthdayWishes}
                    onChange={() => setNotifications({ ...notifications, birthdayWishes: !notifications.birthdayWishes })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Renewal Reminder</p>
                      <p className="text-xs text-slate-500">Send multi-channel reminders before membership expiry</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="renewalReminder"
                    enabled={notifications.renewalReminder}
                    onChange={() => setNotifications({ ...notifications, renewalReminder: !notifications.renewalReminder })}
                  />
                </div>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 6. SECURITY                                                      */}
            {/* ================================================================ */}
            <SectionCard icon={ShieldCheck} title="Security" subtitle="Password, authentication, and account access" delay={0.12}>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    toast.success("Password change link sent!", {
                      description: "Check your registered email for instructions.",
                    })
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Change Password</p>
                      <p className="text-xs text-slate-500">Update your account password</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="twoFactorAuth"
                    enabled={security.twoFactorAuth}
                    onChange={() => setSecurity({ ...security, twoFactorAuth: !security.twoFactorAuth })}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 p-3 text-left transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Logout</p>
                      <p className="text-xs text-rose-500">Sign out of your account</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* 7. APPEARANCE                                                    */}
            {/* ================================================================ */}
            <SectionCard icon={Palette} title="Appearance" subtitle="Theme, colors, and visual preferences" delay={0.14}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Theme Toggle */}
                <FormField label="Theme" name="theme">
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAppearance({ ...appearance, theme: "light" })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all ${
                        appearance.theme === "light"
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppearance({ ...appearance, theme: "dark" });
                        toast.info("Dark theme coming soon!", {
                          description: "This feature will be available in a future update.",
                        });
                      }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold transition-all ${
                        appearance.theme === "dark"
                          ? "border-slate-900 bg-slate-900 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      Dark (Future)
                    </button>
                  </div>
                </FormField>

                {/* Primary Color */}
                <FormField label="Primary Color" name="primaryColor">
                  <div className="mt-1 grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, primaryColor: color.value })}
                        className={`relative flex h-10 items-center justify-center rounded-2xl transition-all hover:scale-[1.03] ${color.class} ${
                          appearance.primaryColor === color.value
                            ? "ring-2 ring-slate-900 ring-offset-2 scale-[1.05]"
                            : ""
                        }`}
                      >
                        {appearance.primaryColor === color.value && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </SectionCard>

            {/* ================================================================ */}
            {/* SAVE / RESET FOOTER                                              */}
            {/* ================================================================ */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.18, ease: "easeOut" }}
              className="flex flex-col-reverse gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                onClick={() => {
                  toast.info("Settings reset", {
                    description: "All changes have been reverted to defaults.",
                  });
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}