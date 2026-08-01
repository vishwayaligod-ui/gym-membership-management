"use client";

import { Users } from "lucide-react";
import { Card } from "./Card";

type EmptyStateProps = {
  search: string;
};

export function EmptyState({ search }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Card padding="sm" shadow="sm">
        <Users className="h-6 w-6 text-slate-400" />
      </Card>
      <p className="mt-4 text-sm font-semibold text-slate-900">No members found</p>
      <p className="mt-1 text-sm text-slate-500">
        {search ? "Try different search terms" : "Get started by adding a member"}
      </p>
    </div>
  );
}