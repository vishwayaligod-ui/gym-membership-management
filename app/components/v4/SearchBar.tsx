"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder = "Search members by name, phone, or username..." }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-blue-400 focus:bg-white shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-400 shadow-sm">
            ⌘K
          </span>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-medium text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 shadow-sm"
        type="button"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Advanced
      </motion.button>
    </div>
  );
}