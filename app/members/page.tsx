"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Users,
  UserCheck,
  Calendar,
  UserPlus,
  Download,
  Upload,
  X,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
  Pencil,
  Repeat,
  Trash2,
  EllipsisVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { exportRowsToExcel, getExportDateStamp } from "@/lib/export/exportExcel";
import { type MemberStatus, type Member, type MembersKPIs, planColors } from "./types";
import { MembersTable } from "../components/v4/MembersTable";
import { Pagination } from "../components/v4/Pagination";
import { StatusBadge } from "../components/v4/StatusBadge";
import { FadeUp } from "../components/v4/MotionDiv";

const statusFilters: Array<{ label: string; value: MemberStatus | "All" }> = [
  { label: "All", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Expiring", value: "Expiring" },
  { label: "Expired", value: "Expired" },
  { label: "Pending", value: "Pending" },
];

const planFilters = ["All", "Platinum", "Premium", "Classic", "Basic"];
const genderFilters = ["All", "Male", "Female"];
const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Expiry Soon", value: "expiry-asc" },
];

// Compact subtitle for the mobile member list row. Presentation-only: derives
// the "Plan • X days left" / "Plan • Expired X days ago" copy from the member's
// existing expiresOn + status data. No status/business rules are changed here.
function getMobileMemberSublabel(member: Member): string {
  if (member.status === "Pending") {
    return "No active plan";
  }

  const expiry = new Date(member.expiresOn);
  if (Number.isNaN(expiry.getTime())) {
    return member.plan;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || (member.status === "Expired" && diffDays === 0)) {
    const daysPast = Math.max(0, Math.abs(diffDays));
    const agoLabel =
      daysPast === 0 ? "today" : daysPast === 1 ? "yesterday" : `${daysPast} days ago`;
    return `${member.plan} • Expired ${agoLabel}`;
  }
  if (diffDays === 0) {
    return `${member.plan} • Expires today`;
  }
  return `${member.plan} • ${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
}

export default function MembersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "All">("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [kpis, setKpis] = useState<MembersKPIs>({
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    newThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "All") params.set("status", statusFilter);
      if (planFilter !== "All") params.set("plan", planFilter);
      if (genderFilter !== "All") params.set("gender", genderFilter);
      if (sortBy !== "newest") params.set("sortBy", sortBy);

      const response = await fetch(`/api/members?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data.members);
      setKpis(data.kpis);
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, planFilter, genderFilter, sortBy]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Mobile-only UI state: overflow menu (Export/Import) and the per-member
  // action sheet. Presentation-layer only — both reuse the existing handlers.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [actionSheetMember, setActionSheetMember] = useState<Member | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close the mobile overflow menu when tapping/clicking outside of it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobileMenuOpen]);

  // Pagination (client-side after filtering)
  const filteredMembers = useMemo(() => {
    return members;
  }, [members]);

  const totalPages = Math.ceil(filteredMembers.length / rowsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = statusFilter !== "All" || planFilter !== "All" || genderFilter !== "All" || sortBy !== "newest";

  const resetFilters = () => {
    setStatusFilter("All");
    setPlanFilter("All");
    setGenderFilter("All");
    setSortBy("newest");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleDelete = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(memberId);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete member");
      }

      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete member");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        toast.error("The file does not contain any sheets.");
        return;
      }
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      if (jsonRows.length === 0) {
        toast.error("The file does not contain any data rows.");
        return;
      }

      const rows = jsonRows.map((r) => {
        // Combine separate First Name / Last Name columns if present.
        const firstName = String(r["First Name"] ?? r["firstName"] ?? "").trim();
        const lastName = String(r["Last Name"] ?? r["lastName"] ?? "").trim();
        const fullNameFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
        const fullNameFromColumn = String(
          r["Full Name"] ?? r["fullName"] ?? r["Name of Member"] ?? ""
        ).trim();
        const fullName = fullNameFromParts || fullNameFromColumn;

        // Pick the first non-empty value from the candidate source columns.
        const pickValue = (...keys: string[]): string | number => {
          for (const key of keys) {
            const v = r[key];
            if (v !== "" && v != null) {
              return typeof v === "number" ? v : String(v);
            }
          }
          return "";
        };

        return {
          fullName,
          mobileNumber: String(pickValue("Mobile Number", "mobileNumber", "Contact")).trim(),
          emailAddress: String(pickValue("Email Address", "emailAddress")).trim(),
          gender: String(pickValue("Gender", "gender")).trim(),
          dateOfBirth: String(pickValue("Date of Birth", "dateOfBirth")).trim(),
          address: String(pickValue("Address", "address")).trim(),
          emergencyContact: String(pickValue("Emergency Contact", "emergencyContact")).trim(),
          membershipPlan: String(pickValue("Membership Plan", "membershipPlan")).trim(),
          planPrice: pickValue("Our Package", "planPrice"),
          planDuration: String(pickValue("Duration", "planDuration")).trim(),
          joiningDate: String(pickValue("Joining Date", "joiningDate", "Payment - Start Date")).trim(),
          expiryDate: String(pickValue("Expiry Date", "expiryDate", "Payment - Date of Expiry")).trim(),
          membershipFee: pickValue("Membership Fee", "membershipFee", "Payment - Paid"),
          paymentRemaining: String(pickValue("Payment - Remaining", "paymentRemaining")).trim(),
          paymentMethod: String(pickValue("Payment Method", "paymentMethod")).trim(),
          notes: String(pickValue("Notes", "notes")).trim(),
        };
      });

      const response = await fetch("/api/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to import members");
      }

      if (data.skipped?.length > 0) {
        const skippedSummary = data.skipped
          .slice(0, 5)
          .map((s: { row: number; reason: string }) => `Row ${s.row}: ${s.reason}`)
          .join("\n");
        const remaining = data.skipped.length - 5;
        toast.warning(
          `${data.message}\n\n${skippedSummary}${remaining > 0 ? `\n...and ${remaining} more` : ""}`,
          { duration: 8000 }
        );
      } else {
        toast.success(data.message || "Members imported successfully");
      }

      fetchMembers();
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to import members:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import members");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const rows = members.map((member) => ({
      "Member ID": member.id,
      Name: member.name,
      Username: member.username,
      Phone: member.phone,
      Email: member.email,
      Plan: member.plan,
      Gender: member.gender,
      "Join Date": member.joinedOn,
      "Expiry Date": member.expiresOn,
      Status: member.status,
      "Visits": member.visits,
      "MTD": member.mtd,
      "Lifetime Revenue": member.lifetimeRevenue,
    }));

    const exported = exportRowsToExcel(
      rows,
      "Members",
      `Members_Export_${getExportDateStamp()}`
    );

    if (exported) {
      toast.success("Members exported successfully");
    } else {
      toast.error("No member data available to export.");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Shared hidden file input for Excel/CSV import — used by the desktop
          Import button and the mobile overflow menu. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImportFile(file);
          }
        }}
      />

      {/* ═══════════════════════════════════════════
         MOBILE (below md): compact receptionist member list
         SEARCH → FILTER → MEMBER LIST → MEMBER DETAILS
         ═══════════════════════════════════════════ */}
      <div className="space-y-4 md:hidden">
        {/* Compact page header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-100">
            Members
          </h1>
          <div className="flex items-center gap-2">
            {/* Overflow: Export / Import — compact, least intrusive placement */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={isMobileMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200 active:scale-95"
              >
                <EllipsisVertical className="h-[18px] w-[18px]" />
              </button>
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700 bg-[#111827] py-1 shadow-2xl shadow-black/50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleExport();
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                      Export members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleImportButtonClick();
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                      ) : (
                        <Upload className="h-4 w-4 text-slate-500" />
                      )}
                      Import members
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add member — existing route/action preserved */}
            <button
              type="button"
              onClick={() => router.push("/members/add")}
              aria-label="Add Member"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 active:scale-95"
            >
              <Plus className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Search — first interactive element on the page */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full rounded-xl border border-slate-700/70 bg-slate-900/60 pl-10 pr-10 text-[15px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter chips — wired to the existing statusFilter logic */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setStatusFilter(f.value);
                  setCurrentPage(1);
                }}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-95 ${
                  statusFilter === f.value
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "border border-slate-700/70 bg-slate-800/50 text-slate-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="More filters"
            aria-expanded={showFilters}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 ${
              showFilters || planFilter !== "All" || genderFilter !== "All" || sortBy !== "newest"
                ? "border-blue-500/40 bg-blue-900/20 text-blue-400"
                : "border-slate-700 bg-slate-800/50 text-slate-400"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced filters — existing plan/gender/sort state and handlers */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="mobile-plan-filter" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Plan
                    </label>
                    <select
                      id="mobile-plan-filter"
                      value={planFilter}
                      onChange={(e) => {
                        setPlanFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2 text-[13px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {planFilters.map((p) => (
                        <option key={p} value={p} className="bg-slate-800 text-slate-300">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="mobile-gender-filter" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Gender
                    </label>
                    <select
                      id="mobile-gender-filter"
                      value={genderFilter}
                      onChange={(e) => {
                        setGenderFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2 text-[13px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {genderFilters.map((g) => (
                        <option key={g} value={g} className="bg-slate-800 text-slate-300">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="mobile-sort-filter" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Sort
                    </label>
                    <select
                      id="mobile-sort-filter"
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-2 text-[13px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {sortOptions.map((s) => (
                        <option key={s.value} value={s.value} className="bg-slate-800 text-slate-300">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 py-2 text-[12px] font-semibold text-red-400 transition-all hover:bg-red-950/30 active:scale-[0.99]"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member list / states */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-14 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
            <p className="mt-3 text-[14px] font-semibold text-slate-300">Loading members...</p>
          </div>
        ) : paginatedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700/40">
              <Users className="h-5 w-5 text-slate-500" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-slate-300">No members found</p>
            <p className="mt-1 max-w-xs text-[13px] text-slate-500">
              {searchQuery || hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Get started by adding your first member."}
            </p>
            {!searchQuery && !hasActiveFilters && (
              <button
                type="button"
                onClick={() => router.push("/members/add")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
              <div className="divide-y divide-slate-700/40">
                {paginatedMembers.map((member) => (
                  <div
                    key={member.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/members/${member.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/members/${member.id}`);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors active:bg-slate-700/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[12px] font-bold text-white shadow-sm shadow-blue-900/30">
                      {member.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-snug text-slate-100">
                        {member.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {getMobileMemberSublabel(member)}
                      </p>
                    </div>
                    <StatusBadge status={member.status} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionSheetMember(member);
                      }}
                      aria-label={`Actions for ${member.name}`}
                      aria-haspopup="menu"
                      className="-mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-300 active:bg-slate-700/40"
                    >
                      <EllipsisVertical className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMembers.length}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
         TABLET/DESKTOP (md and up): existing layout — unchanged
         ═══════════════════════════════════════════ */}
      <div className="hidden md:block space-y-6">
      {/* ═══════════════════════════════════════════
         PAGE HEADER
         ═══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage all gym members from one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/members/add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/30"
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-[12px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleImportButtonClick}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-[12px] font-semibold text-slate-400 transition-all hover:border-slate-600 hover:text-slate-200"
            type="button"
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Import
          </motion.button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════
         TOP SUMMARY CARDS
         ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FadeUp delay={0.05}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-900/30">
                <Users className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Total Members
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.totalMembers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">All registered members</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-900/30">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Active Memberships
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.activeMembers}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {kpis.totalMembers > 0 ? `${Math.round((kpis.activeMembers / kpis.totalMembers) * 100)}% of total` : "0% of total"}
            </p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/30">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                Expiring This Month
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.expiringSoon}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">Requires attention</p>
          </motion.div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-[18px] transition-all hover:border-slate-600/60 hover:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900/30">
                <UserPlus className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-slate-500">
                New This Month
              </span>
            </div>
            <p className="mt-2 text-[24px] font-semibold tabular-nums text-slate-100">
              {isLoading ? "..." : kpis.newThisMonth}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">New registrations</p>
          </motion.div>
        </FadeUp>
      </div>

      {/* ═══════════════════════════════════════════
         SEARCH & FILTER BAR
         ═══════════════════════════════════════════ */}
      <FadeUp delay={0.1}>
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 sm:p-5">
          {/* Search Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-4 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[12px] font-semibold transition-all ${
                showFilters || hasActiveFilters
                  ? "border-blue-500/40 bg-blue-900/20 text-blue-400"
                  : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
              type="button"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {
                    [statusFilter !== "All", planFilter !== "All", genderFilter !== "All", sortBy !== "newest"].filter(Boolean).length
                  }
                </span>
              )}
            </motion.button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-700/40 pt-4"
            >
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Status:</label>
                <div className="flex flex-wrap gap-1.5">
                  {statusFilters.map((f) => (
                    <motion.button
                      key={f.value}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setStatusFilter(f.value);
                        setCurrentPage(1);
                      }}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        statusFilter === f.value
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "border border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                      type="button"
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Plan:</label>
                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {planFilters.map((p) => (
                    <option key={p} value={p} className="bg-slate-800 text-slate-300">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Gender:</label>
                <select
                  value={genderFilter}
                  onChange={(e) => {
                    setGenderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {genderFilters.map((g) => (
                    <option key={g} value={g} className="bg-slate-800 text-slate-300">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-500">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-[12px] font-medium text-slate-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-800 text-slate-300">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-all hover:bg-red-950/30"
                  type="button"
                >
                  <X className="h-3 w-3" />
                  Reset
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </FadeUp>

      {/* ═══════════════════════════════════════════
         MAIN CONTENT: TABLE
         ═══════════════════════════════════════════ */}
      <div className="space-y-4">
          {isLoading ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                <p className="mt-4 text-base font-semibold text-slate-300">Loading members...</p>
              </div>
            </FadeUp>
          ) : paginatedMembers.length === 0 ? (
            <FadeUp delay={0.15}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/40 px-6 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/40">
                  <Users className="h-6 w-6 text-slate-500" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-300">No Members Found</p>
                <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
                  {searchQuery || hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : "Get started by adding your first member to the system."}
                </p>
                {!searchQuery && !hasActiveFilters && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/members/add")}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </motion.button>
                )}
              </div>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={0.15}>
                <MembersTable
                  members={paginatedMembers}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              </FadeUp>

              <FadeUp delay={0.2}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMembers.length}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setCurrentPage(1);
                  }}
                />
              </FadeUp>
            </>
          )}
      </div>
      </div>

      {/* Mobile member action sheet — keeps the previous per-card Edit / Renew /
          Delete actions available without cluttering the list. All actions
          reuse the same routes/handlers the Members page has always used. */}
      <AnimatePresence>
        {actionSheetMember && (
          <MemberActionSheet
            key="member-action-sheet"
            member={actionSheetMember}
            isDeleting={isDeleting}
            onClose={() => setActionSheetMember(null)}
            onEdit={(id) => {
              setActionSheetMember(null);
              router.push(`/members/${id}/edit`);
            }}
            onRenew={(id) => {
              setActionSheetMember(null);
              router.push(`/renewals?memberId=${id}`);
            }}
            onDelete={(id) => {
              setActionSheetMember(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MOBILE MEMBER ACTION SHEET
   Compact bottom sheet that preserves the previous per-card Edit / Renew /
   Delete actions without putting large buttons on every member row. Every
   action reuses the same routes/handlers the Members page has always used.
   ═══════════════════════════════════════════ */
type MemberActionSheetProps = {
  member: Member;
  isDeleting: string | null;
  onClose: () => void;
  onEdit: (memberId: string) => void;
  onRenew: (memberId: string) => void;
  onDelete: (memberId: string) => void;
};

function MemberActionSheet({
  member,
  isDeleting,
  onClose,
  onEdit,
  onRenew,
  onDelete,
}: MemberActionSheetProps) {
  // Close on Escape (consistent with the global navigation drawer).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:hidden"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="menu"
        aria-label={`Actions for ${member.name}`}
        className="w-full max-w-md rounded-t-2xl border-t border-slate-700 bg-[#111827] px-4 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2 shadow-2xl shadow-black/60"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-700" />

        {/* Member summary */}
        <div className="flex items-center gap-3 px-1 pb-2 pt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[12px] font-bold text-white shadow-sm shadow-blue-900/30">
            {member.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-100">
              {member.name}
            </p>
            <p className="truncate text-[12px] text-slate-500">
              {getMobileMemberSublabel(member)}
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <StatusBadge status={member.status} />
          </div>
        </div>

        {/* Actions — same destinations/flows as before */}
        <div className="space-y-0.5 border-t border-slate-700/50 pt-2">
          <button
            type="button"
            role="menuitem"
            onClick={() => onEdit(member.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-slate-200 transition-colors hover:bg-slate-800 active:bg-slate-800"
          >
            <Pencil className="h-[18px] w-[18px] text-blue-400" />
            Edit member
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => onRenew(member.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-slate-200 transition-colors hover:bg-slate-800 active:bg-slate-800"
          >
            <Repeat className="h-[18px] w-[18px] text-blue-400" />
            Renew membership
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => onDelete(member.id)}
            disabled={isDeleting === member.id}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-semibold text-red-400 transition-colors hover:bg-red-950/30 active:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting === member.id ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <Trash2 className="h-[18px] w-[18px]" />
            )}
            Delete member
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-[14px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 active:scale-[0.99]"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}