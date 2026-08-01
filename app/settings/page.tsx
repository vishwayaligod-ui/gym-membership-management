"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Database,
  Download,
  Globe,
  ImagePlus,
  Loader2,
  Palette,
  Receipt,
  RefreshCcw,
  Save,
  Settings2,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { FormField } from "@/app/components/FormField";
import {
  cloneDefaultGymSettings,
  defaultGymSettings,
  type GymSettingsPayload,
  type SettingsBackupItem,
  type SettingsPageResponse,
} from "./types";

type FieldErrors = Record<string, string>;

type SettingsSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const settingsSections: SettingsSection[] = [
  { id: "gym-info", label: "Gym Information", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "membership", label: "Membership", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "attendance", label: "Attendance", icon: Check },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "User Preferences", icon: Settings2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "backup", label: "Backup", icon: Database },
];

const reminderBeforeOptions = [1, 3, 7, 15] as const;

const currencyOptions = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

const defaultDashboardOptions = [
  { value: "overview", label: "Overview" },
  { value: "members", label: "Members" },
  { value: "attendance", label: "Attendance" },
  { value: "payments", label: "Payments" },
  { value: "reports", label: "Reports" },
];

const defaultLanguageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
];

const dateFormatOptions = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const timeFormatOptions = [
  { value: "12h", label: "12 Hour" },
  { value: "24h", label: "24 Hour" },
];

const timezoneOptions = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
        enabled ? "bg-emerald-500" : "bg-slate-700"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="rounded-lg bg-blue-900/30 p-2 text-blue-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100 sm:text-base">{title}</h2>
          <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function validateSettings(settings: GymSettingsPayload): FieldErrors {
  const errors: FieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\+?[0-9][0-9\s-]{7,14}$/;
  const pincodePattern = /^\d{4,10}$/;
  const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i;
  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;

  const { gymInformation, branding } = settings;

  if (!gymInformation.gymName.trim()) errors["gymInformation.gymName"] = "Gym name is required";
  if (!gymInformation.ownerName.trim()) errors["gymInformation.ownerName"] = "Owner name is required";
  if (!emailPattern.test(gymInformation.email.trim())) errors["gymInformation.email"] = "Valid email is required";
  if (!phonePattern.test(gymInformation.phone.trim())) errors["gymInformation.phone"] = "Valid phone number is required";
  if (gymInformation.alternatePhone.trim() && !phonePattern.test(gymInformation.alternatePhone.trim())) {
    errors["gymInformation.alternatePhone"] = "Alternate phone is invalid";
  }
  if (!gymInformation.address.trim()) errors["gymInformation.address"] = "Address is required";
  if (!gymInformation.city.trim()) errors["gymInformation.city"] = "City is required";
  if (!gymInformation.state.trim()) errors["gymInformation.state"] = "State is required";
  if (!gymInformation.country.trim()) errors["gymInformation.country"] = "Country is required";
  if (!pincodePattern.test(gymInformation.pincode.trim())) errors["gymInformation.pincode"] = "Valid pincode is required";
  if (gymInformation.gstNumber.trim() && !gstPattern.test(gymInformation.gstNumber.trim())) {
    errors["gymInformation.gstNumber"] = "GST number format is invalid";
  }

  if (gymInformation.website.trim()) {
    try {
      const url = new URL(gymInformation.website.trim());
      if (!(url.protocol === "http:" || url.protocol === "https:")) {
        errors["gymInformation.website"] = "Website URL must start with http or https";
      }
    } catch {
      errors["gymInformation.website"] = "Website URL is invalid";
    }
  }

  if (gymInformation.googleBusinessProfileUrl.trim()) {
    try {
      const url = new URL(gymInformation.googleBusinessProfileUrl.trim());
      if (!(url.protocol === "http:" || url.protocol === "https:") || !/google\./i.test(url.hostname)) {
        errors["gymInformation.googleBusinessProfileUrl"] = "Google Business URL is invalid";
      }
    } catch {
      errors["gymInformation.googleBusinessProfileUrl"] = "Google Business URL is invalid";
    }
  }

  if (!gymInformation.businessHours.trim()) {
    errors["gymInformation.businessHours"] = "Business hours are required";
  }

  if (!hexColorPattern.test(branding.primaryAccentColor)) {
    errors["branding.primaryAccentColor"] = "Primary color must be a valid hex code";
  }

  if (!hexColorPattern.test(branding.secondaryColor)) {
    errors["branding.secondaryColor"] = "Secondary color must be a valid hex code";
  }

  return errors;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(settingsSections[0].id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [settings, setSettings] = useState<GymSettingsPayload>(cloneDefaultGymSettings());
  const [initialSettings, setInitialSettings] = useState<GymSettingsPayload>(cloneDefaultGymSettings());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [backups, setBackups] = useState<SettingsBackupItem[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string>("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const brandingLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [initialSettings, settings]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const payload = (await response.json()) as SettingsPageResponse;
      setSettings(payload.settings);
      setInitialSettings(payload.settings);
      setBackups(payload.backups ?? []);
      setSelectedBackupId(payload.backups?.[0]?.id ?? "");
      setFieldErrors({});
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Unable to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveSection(hash);
    };

    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setPartialSettings = <K extends keyof GymSettingsPayload>(
    section: K,
    value: GymSettingsPayload[K]
  ) => {
    setSettings((prev) => ({ ...prev, [section]: value }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "gymLogo" | "brandingLogo" | "favicon"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setSettings((prev) => {
        if (target === "gymLogo") {
          return {
            ...prev,
            gymInformation: {
              ...prev.gymInformation,
              gymLogo: dataUrl,
            },
            branding: {
              ...prev.branding,
              gymLogo: dataUrl,
            },
          };
        }

        if (target === "brandingLogo") {
          return {
            ...prev,
            branding: {
              ...prev.branding,
              gymLogo: dataUrl,
            },
          };
        }

        return {
          ...prev,
          branding: {
            ...prev.branding,
            favicon: dataUrl,
          },
        };
      });

      toast.success("Image uploaded and preview updated");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to process selected image");
    }
  };

  const handleSave = async () => {
    const errors = validateSettings(settings);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      const payload = (await response.json()) as
        | { error?: string; settings?: GymSettingsPayload; backups?: SettingsBackupItem[]; fieldErrors?: FieldErrors }
        | undefined;

      if (!response.ok) {
        setFieldErrors(payload?.fieldErrors ?? {});
        throw new Error(payload?.error || "Failed to save settings");
      }

      if (payload?.settings) {
        setSettings(payload.settings);
        setInitialSettings(payload.settings);
      }
      if (payload?.backups) {
        setBackups(payload.backups);
        setSelectedBackupId(payload.backups[0]?.id ?? "");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Reset all settings to default values?");
      if (!confirmed) return;
    }

    setSettings(cloneDefaultGymSettings());
    setFieldErrors({});
    toast.info("Default values loaded. Click Save All Settings to persist.");
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackingUp(true);
      const response = await fetch("/api/settings/backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: `Backup ${new Date().toLocaleString()}`,
        }),
      });

      const payload = (await response.json()) as { error?: string; backups?: SettingsBackupItem[]; message?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create backup");
      }

      setBackups(payload.backups ?? []);
      setSelectedBackupId(payload.backups?.[0]?.id ?? "");
      setSettings((prev) => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackupAt: new Date().toISOString(),
        },
      }));
      toast.success(payload.message || "Backup created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupId) {
      toast.error("Select a backup to restore");
      return;
    }

    const confirmed = window.confirm("Restore selected backup? Unsaved changes will be overwritten.");
    if (!confirmed) return;

    try {
      setIsRestoringBackup(true);
      const response = await fetch("/api/settings/backups", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ backupId: selectedBackupId }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        settings?: GymSettingsPayload;
        backups?: SettingsBackupItem[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to restore backup");
      }

      if (payload.settings) {
        setSettings(payload.settings);
        setInitialSettings(payload.settings);
      }
      if (payload.backups) {
        setBackups(payload.backups);
      }

      toast.success(payload.message || "Backup restored successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore backup");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const downloadJson = async (kind: "configuration" | "database") => {
    try {
      const response = await fetch(`/api/settings/export?kind=${kind}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to export data");
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        kind === "configuration"
          ? `gym-configuration-${new Date().toISOString().slice(0, 10)}.json`
          : `gym-database-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(kind === "configuration" ? "Configuration downloaded" : "Database export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export data");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading gym settings...</span>
        </div>
      </div>
    );
  }

  const gymLogoPreview = settings.gymInformation.gymLogo || settings.branding.gymLogo;
  const faviconPreview = settings.branding.favicon;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Gym Configuration</h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure branding, operations, notifications, security, and backup controls for your gym.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchSettings}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
                    window.location.hash = section.id;
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    active
                      ? "border-blue-500/40 bg-blue-900/20 text-blue-300"
                      : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <SectionCard
            id="gym-info"
            icon={Building2}
            title="Gym Information"
            subtitle="Business identity, contact details, location, and primary operating hours"
          >
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Gym Logo Preview</p>
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-300">
                  {gymLogoPreview ? (
                    <img src={gymLogoPreview} alt="Gym logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">No Logo</span>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                  onChange={(event) => handleImageUpload(event, "gymLogo")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload Logo
                </button>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Business Hours</p>
                <textarea
                  value={settings.gymInformation.businessHours}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      businessHours: event.target.value,
                    })
                  }
                  className="h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                  placeholder="Mon-Sat: 6:00 AM - 10:00 PM, Sun: 7:00 AM - 1:00 PM"
                />
                {fieldErrors["gymInformation.businessHours"] && (
                  <p className="mt-2 text-xs text-rose-400">{fieldErrors["gymInformation.businessHours"]}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Gym Name" name="gymName" required error={fieldErrors["gymInformation.gymName"]}>
                <input
                  value={settings.gymInformation.gymName}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      gymName: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Owner Name" name="ownerName" required error={fieldErrors["gymInformation.ownerName"]}>
                <input
                  value={settings.gymInformation.ownerName}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      ownerName: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Email" name="email" required error={fieldErrors["gymInformation.email"]}>
                <input
                  type="email"
                  value={settings.gymInformation.email}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Phone" name="phone" required error={fieldErrors["gymInformation.phone"]}>
                <input
                  value={settings.gymInformation.phone}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      phone: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField
                label="Alternate Phone"
                name="alternatePhone"
                error={fieldErrors["gymInformation.alternatePhone"]}
              >
                <input
                  value={settings.gymInformation.alternatePhone}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      alternatePhone: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Pincode" name="pincode" required error={fieldErrors["gymInformation.pincode"]}>
                <input
                  value={settings.gymInformation.pincode}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      pincode: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Address" name="address" required error={fieldErrors["gymInformation.address"]}>
                  <textarea
                    value={settings.gymInformation.address}
                    onChange={(event) =>
                      setPartialSettings("gymInformation", {
                        ...settings.gymInformation,
                        address: event.target.value,
                      })
                    }
                    className="min-h-20 w-full resize-none rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </FormField>
              </div>

              <FormField label="City" name="city" required error={fieldErrors["gymInformation.city"]}>
                <input
                  value={settings.gymInformation.city}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      city: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="State" name="state" required error={fieldErrors["gymInformation.state"]}>
                <input
                  value={settings.gymInformation.state}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      state: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Country" name="country" required error={fieldErrors["gymInformation.country"]}>
                <input
                  value={settings.gymInformation.country}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      country: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="GST Number" name="gst" error={fieldErrors["gymInformation.gstNumber"]}>
                <input
                  value={settings.gymInformation.gstNumber}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      gstNumber: event.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm uppercase text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Website" name="website" error={fieldErrors["gymInformation.website"]}>
                <input
                  value={settings.gymInformation.website}
                  onChange={(event) =>
                    setPartialSettings("gymInformation", {
                      ...settings.gymInformation,
                      website: event.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label="Google Business Profile URL"
                  name="googleBusinessProfileUrl"
                  error={fieldErrors["gymInformation.googleBusinessProfileUrl"]}
                >
                  <input
                    value={settings.gymInformation.googleBusinessProfileUrl}
                    onChange={(event) =>
                      setPartialSettings("gymInformation", {
                        ...settings.gymInformation,
                        googleBusinessProfileUrl: event.target.value,
                      })
                    }
                    placeholder="https://g.page/..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="branding"
            icon={Palette}
            title="Branding"
            subtitle="Primary and secondary colors, white-label visuals, logo, and favicon"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Primary Accent Color"
                name="primaryAccentColor"
                required
                error={fieldErrors["branding.primaryAccentColor"]}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.branding.primaryAccentColor}
                    onChange={(event) =>
                      setPartialSettings("branding", {
                        ...settings.branding,
                        primaryAccentColor: event.target.value,
                      })
                    }
                    className="h-10 w-12 rounded border border-slate-700 bg-transparent"
                  />
                  <input
                    value={settings.branding.primaryAccentColor}
                    onChange={(event) =>
                      setPartialSettings("branding", {
                        ...settings.branding,
                        primaryAccentColor: event.target.value,
                      })
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </FormField>

              <FormField
                label="Secondary Color"
                name="secondaryColor"
                required
                error={fieldErrors["branding.secondaryColor"]}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.branding.secondaryColor}
                    onChange={(event) =>
                      setPartialSettings("branding", {
                        ...settings.branding,
                        secondaryColor: event.target.value,
                      })
                    }
                    className="h-10 w-12 rounded border border-slate-700 bg-transparent"
                  />
                  <input
                    value={settings.branding.secondaryColor}
                    onChange={(event) =>
                      setPartialSettings("branding", {
                        ...settings.branding,
                        secondaryColor: event.target.value,
                      })
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </FormField>

              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="text-xs font-medium text-slate-500">Branding Logo</p>
                <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-400">
                  {settings.branding.gymLogo ? (
                    <img src={settings.branding.gymLogo} alt="Branding logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                </div>
                <input
                  ref={brandingLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(event) => handleImageUpload(event, "brandingLogo")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => brandingLogoInputRef.current?.click()}
                  className="mt-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-600"
                >
                  Upload Logo
                </button>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                <p className="text-xs font-medium text-slate-500">Favicon</p>
                <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-400">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" className="h-full w-full object-cover" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={(event) => handleImageUpload(event, "favicon")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  className="mt-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-600"
                >
                  Upload Favicon
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="membership"
            icon={Users}
            title="Membership Settings"
            subtitle="Defaults, lifecycle controls, and expiry automation"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Default Membership Duration (Days)" name="defaultDuration">
                <input
                  type="number"
                  min={1}
                  max={730}
                  value={settings.membershipSettings.defaultMembershipDurationDays}
                  onChange={(event) =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      defaultMembershipDurationDays: Number(event.target.value) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Default Freeze Days" name="defaultFreezeDays">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={settings.membershipSettings.defaultFreezeDays}
                  onChange={(event) =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      defaultFreezeDays: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Reminder Before" name="reminderBeforeDays">
                <select
                  value={settings.membershipSettings.reminderBeforeDays}
                  onChange={(event) =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      reminderBeforeDays: Number(event.target.value) as 1 | 3 | 7 | 15,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {reminderBeforeOptions.map((days) => (
                    <option key={days} value={days} className="bg-slate-900 text-slate-100">
                      {days} day{days > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Grace Period After Expiry (Days)" name="gracePeriod">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={settings.membershipSettings.gracePeriodAfterExpiryDays}
                  onChange={(event) =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      gracePeriodAfterExpiryDays: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Allow Multiple Active Memberships</p>
                  <p className="text-xs text-slate-500">Let a member have more than one active plan</p>
                </div>
                <ToggleSwitch
                  id="allowMultipleActiveMemberships"
                  enabled={settings.membershipSettings.allowMultipleActiveMemberships}
                  onChange={() =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      allowMultipleActiveMemberships: !settings.membershipSettings.allowMultipleActiveMemberships,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Auto Activate Membership</p>
                  <p className="text-xs text-slate-500">Automatically activate on successful signup payment</p>
                </div>
                <ToggleSwitch
                  id="autoActivateMembership"
                  enabled={settings.membershipSettings.autoActivateMembership}
                  onChange={() =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      autoActivateMembership: !settings.membershipSettings.autoActivateMembership,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Membership Expiry Reminder</p>
                  <p className="text-xs text-slate-500">Enable reminders before membership expires</p>
                </div>
                <ToggleSwitch
                  id="membershipExpiryReminder"
                  enabled={settings.membershipSettings.membershipExpiryReminder}
                  onChange={() =>
                    setPartialSettings("membershipSettings", {
                      ...settings.membershipSettings,
                      membershipExpiryReminder: !settings.membershipSettings.membershipExpiryReminder,
                    })
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="payments"
            icon={Receipt}
            title="Payment Settings"
            subtitle="Currency, tax, fees, and receipt number strategy"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Currency" name="currency">
                <select
                  value={settings.paymentSettings.currency}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      currency: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Currency Symbol" name="currencySymbol">
                <input
                  value={settings.paymentSettings.currencySymbol}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      currencySymbol: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Tax Percentage" name="taxPercentage">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.paymentSettings.taxPercentage}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      taxPercentage: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Late Fee" name="lateFee">
                <input
                  type="number"
                  min={0}
                  value={settings.paymentSettings.lateFee}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      lateFee: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Receipt Prefix" name="receiptPrefix">
                <input
                  value={settings.paymentSettings.receiptPrefix}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      receiptPrefix: event.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm uppercase text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Invoice Prefix" name="invoicePrefix">
                <input
                  value={settings.paymentSettings.invoicePrefix}
                  onChange={(event) =>
                    setPartialSettings("paymentSettings", {
                      ...settings.paymentSettings,
                      invoicePrefix: event.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm uppercase text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Auto Generate Receipt Number</p>
                <p className="text-xs text-slate-500">Generate unique receipt number for each new payment</p>
              </div>
              <ToggleSwitch
                id="autoGenerateReceiptNumber"
                enabled={settings.paymentSettings.autoGenerateReceiptNumber}
                onChange={() =>
                  setPartialSettings("paymentSettings", {
                    ...settings.paymentSettings,
                    autoGenerateReceiptNumber: !settings.paymentSettings.autoGenerateReceiptNumber,
                  })
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="attendance"
            icon={Clock3}
            title="Attendance Settings"
            subtitle="Check-in rules, thresholds, hours, and auto-close controls"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Late Arrival Threshold (Minutes)" name="lateArrivalThresholdMins">
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={settings.attendanceSettings.lateArrivalThresholdMins}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      lateArrivalThresholdMins: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Attendance Auto Close Time" name="attendanceAutoCloseTime">
                <input
                  type="time"
                  value={settings.attendanceSettings.attendanceAutoCloseTime}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      attendanceAutoCloseTime: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Working Hours Start" name="workingHoursStart">
                <input
                  type="time"
                  value={settings.attendanceSettings.workingHoursStart}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      workingHoursStart: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Working Hours End" name="workingHoursEnd">
                <input
                  type="time"
                  value={settings.attendanceSettings.workingHoursEnd}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      workingHoursEnd: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Check-in Window Start" name="checkInWindowStart">
                <input
                  type="time"
                  value={settings.attendanceSettings.checkInWindowStart}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      checkInWindowStart: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>

              <FormField label="Check-in Window End" name="checkInWindowEnd">
                <input
                  type="time"
                  value={settings.attendanceSettings.checkInWindowEnd}
                  onChange={(event) =>
                    setPartialSettings("attendanceSettings", {
                      ...settings.attendanceSettings,
                      checkInWindowEnd: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Allow Multiple Check-ins</p>
                <p className="text-xs text-slate-500">Allow more than one check-in for the same day</p>
              </div>
              <ToggleSwitch
                id="allowMultipleCheckIns"
                enabled={settings.attendanceSettings.allowMultipleCheckIns}
                onChange={() =>
                  setPartialSettings("attendanceSettings", {
                    ...settings.attendanceSettings,
                    allowMultipleCheckIns: !settings.attendanceSettings.allowMultipleCheckIns,
                  })
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="notifications"
            icon={Bell}
            title="Notification Settings"
            subtitle="Select channel and trigger preferences for automated communication"
          >
            <div className="grid gap-3">
              {[
                {
                  key: "whatsappNotifications",
                  title: "WhatsApp Notifications",
                  description: "Send reminders over WhatsApp",
                },
                {
                  key: "smsNotifications",
                  title: "SMS Notifications",
                  description: "Send reminders over SMS",
                },
                {
                  key: "emailNotifications",
                  title: "Email Notifications",
                  description: "Send reminders over email",
                },
                {
                  key: "renewalReminder",
                  title: "Renewal Reminder",
                  description: "Notify members before renewal due date",
                },
                {
                  key: "paymentReminder",
                  title: "Payment Reminder",
                  description: "Notify members for outstanding dues",
                },
                {
                  key: "birthdayWishes",
                  title: "Birthday Wishes",
                  description: "Automated birthday wish message",
                },
                {
                  key: "attendanceReminder",
                  title: "Attendance Reminder",
                  description: "Nudge inactive members to check in",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <ToggleSwitch
                    id={item.key}
                    enabled={settings.notificationSettings[item.key as keyof GymSettingsPayload["notificationSettings"]]}
                    onChange={() =>
                      setPartialSettings("notificationSettings", {
                        ...settings.notificationSettings,
                        [item.key]: !settings.notificationSettings[item.key as keyof GymSettingsPayload["notificationSettings"]],
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            id="preferences"
            icon={Settings2}
            title="User Preferences"
            subtitle="Default dashboard behavior, localization, and display formats"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Default Dashboard" name="defaultDashboard">
                <select
                  value={settings.userPreferences.defaultDashboard}
                  onChange={(event) =>
                    setPartialSettings("userPreferences", {
                      ...settings.userPreferences,
                      defaultDashboard: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {defaultDashboardOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Default Language" name="defaultLanguage">
                <select
                  value={settings.userPreferences.defaultLanguage}
                  onChange={(event) =>
                    setPartialSettings("userPreferences", {
                      ...settings.userPreferences,
                      defaultLanguage: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {defaultLanguageOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Date Format" name="dateFormat">
                <select
                  value={settings.userPreferences.dateFormat}
                  onChange={(event) =>
                    setPartialSettings("userPreferences", {
                      ...settings.userPreferences,
                      dateFormat: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {dateFormatOptions.map((option) => (
                    <option key={option} value={option} className="bg-slate-900 text-slate-100">
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Time Format" name="timeFormat">
                <select
                  value={settings.userPreferences.timeFormat}
                  onChange={(event) =>
                    setPartialSettings("userPreferences", {
                      ...settings.userPreferences,
                      timeFormat: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {timeFormatOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Timezone" name="timezone">
                  <select
                    value={settings.userPreferences.timezone}
                    onChange={(event) =>
                      setPartialSettings("userPreferences", {
                        ...settings.userPreferences,
                        timezone: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option} value={option} className="bg-slate-900 text-slate-100">
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="security"
            icon={Shield}
            title="Security"
            subtitle="Session lifecycle, access hardening, and login tracking behavior"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Session Timeout (Minutes)" name="sessionTimeoutMinutes">
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(event) =>
                    setPartialSettings("security", {
                      ...settings.security,
                      sessionTimeoutMinutes: Number(event.target.value) || 5,
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                />
              </FormField>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Require Password Change</p>
                  <p className="text-xs text-slate-500">Force users to change password on next login</p>
                </div>
                <ToggleSwitch
                  id="requirePasswordChange"
                  enabled={settings.security.requirePasswordChange}
                  onChange={() =>
                    setPartialSettings("security", {
                      ...settings.security,
                      requirePasswordChange: !settings.security.requirePasswordChange,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Two Factor Authentication</p>
                  <p className="text-xs text-slate-500">Enable extra verification for account access</p>
                </div>
                <ToggleSwitch
                  id="twoFactorAuthentication"
                  enabled={settings.security.twoFactorAuthentication}
                  onChange={() =>
                    setPartialSettings("security", {
                      ...settings.security,
                      twoFactorAuthentication: !settings.security.twoFactorAuthentication,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Login History</p>
                  <p className="text-xs text-slate-500">Track sign-in history for audit and support</p>
                </div>
                <ToggleSwitch
                  id="loginHistoryEnabled"
                  enabled={settings.security.loginHistoryEnabled}
                  onChange={() =>
                    setPartialSettings("security", {
                      ...settings.security,
                      loginHistoryEnabled: !settings.security.loginHistoryEnabled,
                    })
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="backup"
            icon={Database}
            title="Backup"
            subtitle="Create and restore settings snapshots, export configuration, and database data"
          >
            <div className="grid gap-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
                <p className="text-xs font-medium text-slate-500">Last Backup</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {settings.backup.lastBackupAt
                    ? new Date(settings.backup.lastBackupAt).toLocaleString()
                    : "No backup created yet"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-900/60 bg-blue-900/20 px-4 py-2.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-900/30 disabled:opacity-70"
                >
                  {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Create Backup
                </button>

                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  disabled={isRestoringBackup || backups.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 disabled:opacity-70"
                >
                  {isRestoringBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Restore Backup
                </button>

                <button
                  type="button"
                  onClick={() => downloadJson("database")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-900/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-900/30"
                >
                  <Download className="h-4 w-4" />
                  Export Database
                </button>

                <button
                  type="button"
                  onClick={() => downloadJson("configuration")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-900/60 bg-purple-900/20 px-4 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-900/30"
                >
                  <Download className="h-4 w-4" />
                  Download Configuration
                </button>
              </div>

              <div>
                <label htmlFor="backupSelect" className="mb-2 block text-xs font-medium text-slate-500">
                  Available Backups
                </label>
                <select
                  id="backupSelect"
                  value={selectedBackupId}
                  onChange={(event) => setSelectedBackupId(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  {backups.length === 0 ? (
                    <option value="" className="bg-slate-900 text-slate-100">
                      No backups available
                    </option>
                  ) : (
                    backups.map((backup) => (
                      <option key={backup.id} value={backup.id} className="bg-slate-900 text-slate-100">
                        {backup.label || "Backup"} - {new Date(backup.createdAt).toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-4 z-20 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-3 shadow-[0_16px_40px_rgba(2,6,23,0.45)] backdrop-blur"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            {hasUnsavedChanges
              ? "Unsaved changes detected. Save now to persist your gym configuration."
              : "All settings are up to date."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-700/30 transition hover:from-blue-500 hover:to-blue-400 disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
