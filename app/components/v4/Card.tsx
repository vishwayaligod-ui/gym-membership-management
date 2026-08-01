"use client";

import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg";
};

const paddings = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const shadows = {
  sm: "shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.03)]",
  md: "shadow-[0_4px_16px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)]",
  lg: "shadow-[0_8px_30px_rgba(15,23,42,0.08),0_4px_8px_rgba(15,23,42,0.04)]",
};

export function Card({ children, className = "", padding = "lg", shadow = "md" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white ${shadows[shadow]} ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}