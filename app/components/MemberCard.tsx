"use client";

import { MoreHorizontal, PencilLine, ScanEye } from "lucide-react";
import type { Member, MemberStatus } from "../members/mockMembers";

const statusStyles: Record<MemberStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Expiring: "bg-amber-50 text-amber-700 ring-amber-200",
  Expired: "bg-rose-50 text-rose-700 ring-rose-200",
};

type MemberCardProps = {
  member: Member;
};

export function MemberCard({ member }: MemberCardProps) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-sm font-semibold text-white">
            {member.avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{member.name}</p>
            <p className="truncate text-sm text-slate-500">{member.plan} · {member.phone}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusStyles[member.status]}`}>
          {member.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Joined</p>
          <p className="mt-1 font-medium text-slate-700">{member.joinedOn}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Expires</p>
          <p className="mt-1 font-medium text-slate-700">{member.expiresOn}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600" type="button">
            <ScanEye className="h-4 w-4" />
            View
          </button>
          <button className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600" type="button">
            <PencilLine className="h-4 w-4" />
            Edit
          </button>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600" type="button">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
