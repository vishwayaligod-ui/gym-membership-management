"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, ChevronDown } from "lucide-react";

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, title: "3 memberships expire today", time: "2 min ago", unread: true },
    { id: 2, title: "8 pending payments need review", time: "1 hour ago", unread: true },
    { id: 3, title: "New member registration completed", time: "3 hours ago", unread: false },
  ];

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center border-b border-[#334155] bg-[#0F172A] px-8"
    >
      {/* ── Search Bar ── */}
      <div className="flex flex-1 items-center gap-4">
        <motion.div
          animate={{
            width: searchFocused ? 480 : 400,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`relative flex items-center rounded-2xl border transition-all duration-200 ${
            searchFocused
              ? "border-[#3B82F6]/60 bg-[#1E293B] shadow-lg shadow-[#3B82F6]/10"
              : "border-[#334155] bg-[#1E293B]/60 hover:border-[#475569] hover:bg-[#1E293B]"
          }`}
        >
          <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search members, payments, attendance..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-[#F8FAFC] placeholder-[#64748B] outline-none"
          />
          <kbd className="mr-3 hidden items-center gap-1 rounded-lg border border-[#334155] bg-[#0F172A] px-2 py-0.5 text-[11px] font-medium text-[#64748B] sm:flex">
            <span>⌘</span>K
          </kbd>
        </motion.div>
      </div>

      {/* ── Right Section ── */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setShowNotifications(true)}
            onMouseLeave={() => setShowNotifications(false)}
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B]/60 text-[#64748B] transition-all hover:border-[#475569] hover:bg-[#1E293B] hover:text-[#94A3B8]"
            type="button"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3B82F6] text-[9px] font-bold text-white shadow-lg shadow-[#3B82F6]/30">
              3
            </span>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setShowNotifications(true)}
                onMouseLeave={() => setShowNotifications(false)}
                className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-2xl border border-[#334155] bg-[#111827] shadow-2xl shadow-black/50"
              >
                <div className="border-b border-[#334155]/50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-[#F8FAFC]">Notifications</p>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1E293B]"
                      type="button"
                    >
                      <div
                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          n.unread ? "bg-[#3B82F6]" : "bg-[#334155]"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-[13px] font-medium text-[#F8FAFC]">{n.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#64748B]">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#334155]/50 p-2">
                  <button
                    className="w-full rounded-xl px-3 py-2 text-center text-[12px] font-medium text-[#3B82F6] transition-colors hover:bg-[#1E293B]"
                    type="button"
                  >
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B]/60 text-[#64748B] transition-all hover:border-[#475569] hover:bg-[#1E293B] hover:text-[#94A3B8]"
          type="button"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </motion.button>

        {/* User Avatar & Profile */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => setShowProfile(false)}
            className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#1E293B]/60 px-3 py-2 transition-all hover:border-[#475569] hover:bg-[#1E293B]"
            type="button"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-[12px] font-bold text-white shadow-sm">
              AD
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-medium leading-tight text-[#F8FAFC]">Admin User</p>
              <p className="text-[11px] font-medium text-[#94A3B8]">Administrator</p>
            </div>
            <ChevronDown className="hidden h-[16px] w-[16px] text-[#64748B] sm:block" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setShowProfile(true)}
                onMouseLeave={() => setShowProfile(false)}
                className="absolute right-0 top-full mt-2 w-[200px] overflow-hidden rounded-2xl border border-[#334155] bg-[#111827] shadow-2xl shadow-black/50"
              >
                <div className="p-2">
                  {["Settings", "Profile", "Logout"].map((item) => (
                    <button
                      key={item}
                      className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}