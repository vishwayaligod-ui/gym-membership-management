"use client";

import { Filter, Plus, Search } from "lucide-react";
import { AppHeader } from "../components/AppHeader";
import { BottomNavigation } from "../components/BottomNavigation";
import { MemberCard } from "../components/MemberCard";
import { PageContainer } from "../components/PageContainer";
import { mockMembers } from "./mockMembers";

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f5f8ff_0%,_#eef5ff_100%)] text-slate-900">
      <AppHeader title="Members" />

      <PageContainer>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-slate-950">Members</p>
              <p className="mt-1 text-sm text-slate-500">Manage gym members</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700" type="button">
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search members"
                className="w-full border-none bg-transparent outline-none placeholder:text-slate-400"
              />
            </label>
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600" type="button">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          <div className="space-y-3">
            {mockMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </PageContainer>

      <BottomNavigation />
    </div>
  );
}
