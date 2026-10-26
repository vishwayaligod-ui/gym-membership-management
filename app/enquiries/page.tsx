"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { createEnquirySchema, enquiryFollowUpSchema } from "@/lib/validations/enquiry";

type EnquiryStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "NOT_INTERESTED";
type FollowUpOutcome =
  | "CONTACTED"
  | "NO_ANSWER"
  | "CALLBACK_REQUESTED"
  | "CONVERTED"
  | "NOT_INTERESTED";
type Bucket = "today" | "overdue" | "upcoming" | "all";

type Branch = { id: string; name: string };
type Enquiry = {
  id: string;
  name: string;
  mobileNumber: string;
  nextFollowUpDate: string | null;
  notes: string | null;
  status: EnquiryStatus;
  branchId: string;
  branch: Branch;
  createdAt: string;
  updatedAt: string;
};
type FollowUp = {
  id: string;
  outcome: FollowUpOutcome;
  notes: string | null;
  contactedAt: string;
  nextFollowUpDate: string | null;
  createdAt: string;
  recordedBy: { id: string; name: string } | null;
};
type EnquiryDetail = Enquiry & { followUps: FollowUp[] };
type EnquiriesResponse = {
  enquiries: Enquiry[];
  counts: { today: number; overdue: number; upcoming: number };
  timezone: string;
  totalCount: number;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
};

const statusLabels: Record<EnquiryStatus, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
};

const outcomeLabels: Record<FollowUpOutcome, string> = {
  CONTACTED: "Contacted",
  NO_ANSWER: "No Answer",
  CALLBACK_REQUESTED: "Callback Requested",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-300";

function errorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const first = Object.values(error).flat()[0];
    if (typeof first === "string") return first;
  }
  return "Please check the form fields and try again.";
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatTimestamp(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

function localDateString(timezone = "Asia/Kolkata"): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function EnquiriesPage() {
  const [bucket, setBucket] = useState<Bucket>("today");
  const [status, setStatus] = useState<"ALL" | EnquiryStatus>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [records, setRecords] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EnquiryDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobileNumber: "",
    nextFollowUpDate: localDateString(),
    notes: "",
  });
  const [callForm, setCallForm] = useState<{
    outcome: FollowUpOutcome;
    notes: string;
    nextFollowUpDate: string;
  }>({ outcome: "CONTACTED", notes: "", nextFollowUpDate: "" });
  const listRequestId = useRef(0);
  const detailRequestId = useRef(0);

  useEffect(() => {
    const nextSearch = searchInput.trim();
    const timer = window.setTimeout(() => {
      if (nextSearch !== search) {
        setIsLoading(true);
        setSearch(nextSearch);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, searchInput]);

  const fetchEnquiries = useCallback(async () => {
    const requestId = ++listRequestId.current;
    try {
      const params = new URLSearchParams({ bucket, page: String(page), pageSize: "50" });
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);
      const response = await fetch(`/api/enquiries?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Unable to load enquiries.");
      if (requestId !== listRequestId.current) return;
      const data = payload as EnquiriesResponse;
      setLoadError("");
      setRecords(data.enquiries);
      setCounts(data.counts);
      setTotalPages(data.pagination.totalPages);
      setTotalEnquiries(data.totalCount);
      setTimezone(data.timezone);
      setForm((current) => ({
        ...current,
        nextFollowUpDate:
          current.nextFollowUpDate < localDateString(data.timezone)
            ? localDateString(data.timezone)
            : current.nextFollowUpDate,
      }));
    } catch (error) {
      if (requestId !== listRequestId.current) return;
      setLoadError(error instanceof Error ? error.message : "Unable to load enquiries.");
    } finally {
      if (requestId === listRequestId.current) setIsLoading(false);
    }
  }, [bucket, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEnquiries();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEnquiries]);

  const fetchDetail = useCallback(async (id: string) => {
    const requestId = ++detailRequestId.current;
    setIsDetailLoading(true);
    setDetailError("");
    setSelectedId(id);
    try {
      const response = await fetch(`/api/enquiries/${id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Unable to load enquiry history.");
      if (requestId !== detailRequestId.current) return;
      setDetail(payload.enquiry as EnquiryDetail);
    } catch (error) {
      if (requestId !== detailRequestId.current) return;
      setDetailError(error instanceof Error ? error.message : "Unable to load enquiry history.");
      setDetail(null);
    } finally {
      if (requestId === detailRequestId.current) setIsDetailLoading(false);
    }
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    const parsed = createEnquirySchema.safeParse(form);
    if (!parsed.success) {
      setCreateError(errorText(parsed.error.flatten().fieldErrors));
      return;
    }
    if (parsed.data.nextFollowUpDate < localDateString(timezone)) {
      setCreateError("Follow-up date cannot be in the past.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload?.error));
      setShowCreate(false);
      setForm({
        name: "",
        mobileNumber: "",
        nextFollowUpDate: localDateString(timezone),
        notes: "",
      });
      setFeedback("Enquiry created.");
      await fetchEnquiries();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Unable to create enquiry.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRecordCall = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;
    setFollowUpError("");
    const parsed = enquiryFollowUpSchema.safeParse({
      ...callForm,
      nextFollowUpDate: callForm.nextFollowUpDate || undefined,
    });
    if (!parsed.success) {
      setFollowUpError(errorText(parsed.error.flatten().fieldErrors));
      return;
    }
    if (
      parsed.data.nextFollowUpDate &&
      parsed.data.nextFollowUpDate < localDateString(timezone)
    ) {
      setFollowUpError("Next follow-up date cannot be in the past.");
      return;
    }

    setIsRecording(true);
    try {
      const response = await fetch(`/api/enquiries/${detail.id}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorText(payload?.error));
      setFeedback("Call outcome recorded.");
      setCallForm({ outcome: "CONTACTED", notes: "", nextFollowUpDate: "" });
      await Promise.all([fetchDetail(detail.id), fetchEnquiries()]);
    } catch (error) {
      setFollowUpError(error instanceof Error ? error.message : "Unable to record call outcome.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    const confirmed = window.confirm(
      `Delete the enquiry for ${detail.name}? Its follow-up call history will also be deleted.`,
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setDetailError("");
    try {
      const response = await fetch(`/api/enquiries/${detail.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Unable to delete enquiry.");
      setSelectedId(null);
      setDetail(null);
      setFeedback("Enquiry deleted.");
      await fetchEnquiries();
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Unable to delete enquiry.");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeQueue = bucket !== "all";
  const isClosed = detail?.status === "CONVERTED" || detail?.status === "NOT_INTERESTED";
  const visibleStatusOptions = useMemo(
    () => [
      { value: "ALL" as const, label: "All statuses" },
      { value: "PENDING" as const, label: "Pending" },
      { value: "CONTACTED" as const, label: "Contacted" },
      { value: "CONVERTED" as const, label: "Converted" },
      { value: "NOT_INTERESTED" as const, label: "Not Interested" },
    ],
    [],
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 overflow-x-clip text-slate-200">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blue-400">Reception desk</p>
          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-slate-100 sm:text-3xl">
            Enquiries & follow-ups
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Keep every prospect conversation and next step in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setCreateError("");
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add enquiry
        </button>
      </header>

      {feedback && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          <span className="flex items-center gap-2"><Check className="h-4 w-4" />{feedback}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setFeedback("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {[
          { id: "today" as const, label: "Today's Follow-ups", count: counts.today, icon: CalendarClock },
          { id: "overdue" as const, label: "Overdue", count: counts.overdue, icon: AlertCircle },
          { id: "upcoming" as const, label: "Upcoming", count: counts.upcoming, icon: Clock3 },
          { id: "all" as const, label: "All enquiries", count: totalEnquiries, icon: Phone },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== bucket) {
                  setIsLoading(true);
                  setPage(1);
                  setBucket(item.id);
                }
              }}
              className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all sm:block sm:p-4 ${
                bucket === item.id
                  ? "border-blue-500/50 bg-blue-900/20 shadow-sm shadow-blue-900/10"
                  : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:flex-row">
                <span className="min-w-0 text-xs font-medium text-slate-400 sm:text-sm">{item.label}</span>
                <Icon className={`h-4 w-4 ${bucket === item.id ? "text-blue-400" : "text-slate-500"}`} />
              </div>
              {item.count !== undefined && (
                <span className="shrink-0 text-xl font-bold tabular-nums text-slate-100 sm:mt-2 sm:block sm:text-2xl">{item.count}</span>
              )}
            </button>
          );
        })}
      </section>

      <section className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(350px,0.78fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 shadow-sm shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-slate-700/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-100">
                {bucket === "today" ? "Today's Follow-ups" : bucket === "overdue" ? "Overdue enquiries" : bucket === "upcoming" ? "Upcoming follow-ups" : "All enquiries"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{records.length} shown</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  aria-label="Search by name or mobile"
                  value={searchInput}
                  onChange={(event) => {
                    setPage(1);
                    setSearchInput(event.target.value);
                  }}
                  placeholder="Search name or mobile"
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/60 pl-9 pr-3 text-[13px] text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/20 sm:w-52"
                />
              </label>
              <label className="relative">
                <span className="sr-only">Filter by status</span>
                <select
                  value={status}
                  onChange={(event) => {
                    setIsLoading(true);
                    setPage(1);
                    setStatus(event.target.value as "ALL" | EnquiryStatus);
                  }}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-900/60 pl-3 pr-9 text-[13px] text-slate-300 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 sm:w-44"
                >
                  {visibleStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-800 text-slate-300">{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </label>
            </div>
          </div>

          {loadError && (
            <div role="alert" className="m-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{loadError}</div>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  void fetchEnquiries();
                }}
                className="mt-2 font-semibold text-red-300 underline decoration-red-400/60 underline-offset-2 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading enquiries…
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 rounded-2xl bg-slate-700/40 p-3"><Phone className="h-5 w-5 text-slate-500" /></div>
              <p className="font-semibold text-slate-300">No enquiries found</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {activeQueue ? "There are no enquiries in this follow-up queue." : "Add an enquiry or change your search and filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {records.map((enquiry) => (
                <button
                  key={enquiry.id}
                  type="button"
                  onClick={() => void fetchDetail(enquiry.id)}
                  className={`block w-full px-4 py-4 text-left transition hover:bg-slate-800/70 ${
                    selectedId === enquiry.id ? "bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold text-slate-100 sm:truncate">{enquiry.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          enquiry.status === "CONVERTED" ? "bg-emerald-900/30 text-emerald-400"
                            : enquiry.status === "NOT_INTERESTED" ? "bg-slate-700/50 text-slate-300"
                              : enquiry.status === "CONTACTED" ? "bg-blue-900/30 text-blue-400"
                                : "bg-amber-900/30 text-amber-400"
                        }`}>{statusLabels[enquiry.status]}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-500" /> {enquiry.mobileNumber}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-left sm:block sm:shrink-0 sm:text-right">
                      <p className="text-xs text-slate-500">Next follow-up</p>
                      <p className="text-sm font-medium text-slate-300 sm:mt-1">
                        {formatDate(enquiry.nextFollowUpDate)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{enquiry.branch.name}</span>
                    {enquiry.notes && <span className="min-w-0 break-words sm:max-w-[65%] sm:truncate">{enquiry.notes}</span>}
                  </div>
                </button>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        setPage((current) => Math.max(1, current - 1));
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages || isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        setPage((current) => Math.min(totalPages, current + 1));
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40 shadow-sm shadow-black/10">
          {!selectedId ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <CalendarClock className="h-8 w-8 text-slate-600" />
              <p className="mt-3 font-semibold text-slate-300">Follow-up history</p>
              <p className="mt-1 text-sm text-slate-500">Select an enquiry to view its call timeline and record an outcome.</p>
            </div>
          ) : isDetailLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading call history…
            </div>
          ) : detailError && !detail ? (
            <div role="alert" className="m-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {detailError}
              <button type="button" onClick={() => void fetchDetail(selectedId)} className="mt-2 block font-semibold underline">Try again</button>
            </div>
          ) : detail ? (
            <div className="divide-y divide-slate-700/40">
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-100">{detail.name}</h2>
                  <a href={`tel:${detail.mobileNumber}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                    <Phone className="h-3.5 w-3.5" /> {detail.mobileNumber}
                  </a>
                  <p className="mt-1 break-words text-xs text-slate-500">{detail.branch.name} · {statusLabels[detail.status]}</p>
                  <p className="mt-1 break-words text-xs text-slate-500">Next follow-up: {formatDate(detail.nextFollowUpDate)}</p>
                  {detail.notes && <p className="mt-2 break-words text-sm text-slate-400">{detail.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  aria-label="Delete enquiry"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-red-950/40 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>

              {detailError && <p role="alert" className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{detailError}</p>}

              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-100">Call history</h3>
                {detail.followUps.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 text-sm text-slate-400">No calls recorded yet.</p>
                ) : (
                  <ol className="mt-4 space-y-4">
                    {detail.followUps.map((call) => (
                      <li key={call.id} className="relative border-l border-blue-500/40 pl-4">
                        <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-blue-500" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-200">{outcomeLabels[call.outcome]}</p>
                          <time className="text-xs text-slate-500">{formatTimestamp(call.contactedAt, timezone)}</time>
                        </div>
                        {call.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">{call.notes}</p>}
                        {call.nextFollowUpDate && (
                          <p className="mt-1 text-xs text-blue-400">Next follow-up: {formatDate(call.nextFollowUpDate)}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">Recorded by {call.recordedBy?.name ?? "Former user"}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {!isClosed && (
                <form onSubmit={handleRecordCall} className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Record a call</h3>
                  <div>
                    <label htmlFor="call-outcome" className={labelClass}>Outcome</label>
                    <select
                      id="call-outcome"
                      value={callForm.outcome}
                      onChange={(event) => {
                        const outcome = event.target.value as FollowUpOutcome;
                        setCallForm((current) => ({
                          ...current,
                          outcome,
                          nextFollowUpDate:
                            outcome === "CONVERTED" || outcome === "NOT_INTERESTED"
                              ? ""
                              : current.nextFollowUpDate,
                        }));
                      }}
                      className={`${inputClass} [color-scheme:dark]`}
                    >
                      {(Object.keys(outcomeLabels) as FollowUpOutcome[]).map((outcome) => (
                        <option key={outcome} value={outcome} className="bg-slate-800 text-slate-300">{outcomeLabels[outcome]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="call-notes" className={labelClass}>Call notes <span className="font-normal text-slate-400">(optional)</span></label>
                    <textarea
                      id="call-notes"
                      value={callForm.notes}
                      onChange={(event) => setCallForm((current) => ({ ...current, notes: event.target.value }))}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>
                  {callForm.outcome !== "CONVERTED" && callForm.outcome !== "NOT_INTERESTED" && (
                    <div>
                      <label htmlFor="next-call-date" className={labelClass}>
                        Next follow-up date {callForm.outcome === "CALLBACK_REQUESTED" && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id="next-call-date"
                        type="date"
                        min={localDateString(timezone)}
                        value={callForm.nextFollowUpDate}
                        onChange={(event) => setCallForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))}
                        required={callForm.outcome === "CALLBACK_REQUESTED"}
                        className={`${inputClass} [color-scheme:dark]`}
                      />
                    </div>
                  )}
                  {followUpError && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{followUpError}</p>}
                  <button
                    type="submit"
                    disabled={isRecording}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10"
                  >
                    {isRecording ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving call…</> : "Save call outcome"}
                  </button>
                </form>
              )}
              {isClosed && (
                <p className="p-4 text-sm text-slate-400">This enquiry is closed. Its call history is retained.</p>
              )}
            </div>
          ) : null}
        </aside>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="new-enquiry-heading" className="flex max-h-[calc(100dvh-1rem)] min-h-0 w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl shadow-black/60">
            <div className="flex shrink-0 items-start justify-between gap-3 p-4 sm:p-6 sm:pb-0">
              <div>
                <h2 id="new-enquiry-heading" className="text-[18px] font-bold text-slate-100">Add an enquiry</h2>
                <p className="mt-1 text-sm text-slate-400">Capture contact details and set the first follow-up.</p>
              </div>
              <button type="button" aria-label="Close form" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <div>
                  <label htmlFor="enquiry-name" className={labelClass}>Name <span className="text-red-400">*</span></label>
                  <input id="enquiry-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} minLength={2} maxLength={100} required className={inputClass} placeholder="Person's full name" />
                </div>
                <div>
                  <label htmlFor="enquiry-mobile" className={labelClass}>Indian mobile number <span className="text-red-400">*</span></label>
                  <input id="enquiry-mobile" type="tel" autoComplete="tel" value={form.mobileNumber} onChange={(event) => setForm((current) => ({ ...current, mobileNumber: event.target.value }))} required className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="initial-follow-up" className={labelClass}>Initial follow-up date <span className="text-red-400">*</span></label>
                  <input id="initial-follow-up" type="date" min={localDateString(timezone)} value={form.nextFollowUpDate} onChange={(event) => setForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} required className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div>
                  <label htmlFor="enquiry-notes" className={labelClass}>Notes <span className="font-normal text-slate-500">(optional)</span></label>
                  <textarea id="enquiry-notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={2000} rows={3} className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-3.5 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900/80 focus:ring-1 focus:ring-blue-500/30" />
                </div>
                {createError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{createError}</p>}
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-700/70 p-4 sm:flex-row sm:justify-end sm:p-6 sm:pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 text-[13px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 active:scale-[0.99] sm:w-auto">Cancel</button>
                <button type="submit" disabled={isCreating} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                  {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Create enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
