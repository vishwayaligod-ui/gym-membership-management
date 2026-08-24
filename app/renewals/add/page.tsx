"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RenewalForm } from "@/app/renewals/RenewalForm";

function RenewMembershipContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId");

  return <RenewalForm initialMemberId={memberId ?? undefined} />;
}

export default function RenewMembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <RenewMembershipContent />
    </Suspense>
  );
}