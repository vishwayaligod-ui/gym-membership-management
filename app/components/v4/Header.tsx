"use client";

import { motion } from "framer-motion";

const NAV_ITEMS = ["Overview", "Members", "Classes", "Billing"];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-[11px] font-bold text-white shadow-sm">
            E
          </div>
          <span className="text-sm font-semibold tracking-wide text-slate-900">
            Elite Fitness
          </span>
        </div>

        {/* Navigation Pills */}
        <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${
                item === "Members"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 shadow-sm"
            type="button"
          >
            <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold text-slate-500">
              ⌘K
            </span>
          </motion.button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-[10px] font-bold text-white shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}