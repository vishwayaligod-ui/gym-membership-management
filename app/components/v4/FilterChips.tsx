"use client";

import { motion } from "framer-motion";

type FilterChipsProps = {
  chips: string[];
  activeChip: string;
  onChipClick: (chip: string) => void;
};

export function FilterChips({ chips, activeChip, onChipClick }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {chips.map((chip) => (
        <motion.button
          key={chip}
          onClick={() => onChipClick(chip)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`whitespace-nowrap rounded-full px-5 py-2 text-[12px] font-medium transition-all duration-200 ${
            activeChip === chip
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200"
              : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50"
          }`}
          type="button"
        >
          {chip}
        </motion.button>
      ))}
    </div>
  );
}
