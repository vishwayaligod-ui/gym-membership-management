"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="flex gap-12 px-8 pt-14 pb-10">
      {/* Left: Editorial */}
      <div className="flex-1">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-[56px] leading-[1.1] tracking-tight text-slate-900"
        >
          The people who make{" "}
          <span className="text-blue-600">Elite,</span>
          <br />
          elite.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-500"
        >
          Every member brings their own energy, discipline, and drive. 
          Track, manage, and celebrate the people who make this studio extraordinary.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex items-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 text-[13px] font-semibold text-white transition-all hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
            type="button"
          >
            Add New Member
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-[13px] font-medium text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700 shadow-sm"
            type="button"
          >
            View Reports
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}