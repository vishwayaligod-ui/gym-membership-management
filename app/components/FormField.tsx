"use client";

import { type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
  hint?: string;
};

export function FormField({ label, name, required = false, children, error, hint }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-slate-300">
        {label}
        {required ? <span className="ml-1 text-emerald-400">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}