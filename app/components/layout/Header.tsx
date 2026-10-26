"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { MobileNavDrawer } from "./MobileNavDrawer";

export function Header() {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close the profile menu when tapping/clicking outside. On mobile there is no
  // hover (and no mouseleave) to dismiss it, so this keeps the menu usable.
  useEffect(() => {
    if (!showProfile) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showProfile]);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Restore keyboard focus to the hamburger trigger after the drawer unmounts.
    window.setTimeout(() => hamburgerRef.current?.focus(), 60);
  };

  // If the browser back/forward navigates while the drawer is open, close it so
  // it never lingers over a different page. Regular in-app navigations close the
  // drawer directly in the drawer's nav-click handler.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handlePopState = () => setIsDrawerOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDrawerOpen]);

  const handleProfileMenuClick = (item: { href?: string; type?: "logout" }) => {
    setShowProfile(false);

    // Reuse the same next-auth/react signOut flow used by the Sidebar.
    if (item.type === "logout") {
      void signOut({ redirectTo: "/login" });
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  const notifications = [
    { id: 1, title: "3 memberships expire today", time: "2 min ago", unread: true },
    { id: 2, title: "8 pending payments need review", time: "1 hour ago", unread: true },
    { id: 3, title: "New member registration completed", time: "3 hours ago", unread: false },
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-40 flex h-[52px] shrink-0 items-center gap-2 border-b border-[#334155] bg-[#0F172A] px-4 sm:h-[60px] sm:px-6 lg:px-8 lg:h-[64px]"
    >
      {/* ── Search Bar ── */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Hamburger — mobile/tablet only; opens the global navigation drawer */}
        <motion.button
          ref={hamburgerRef}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={isDrawerOpen}
          aria-controls="app-navigation-drawer"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B]/60 text-[#94A3B8] transition-all hover:border-[#475569] hover:bg-[#1E293B] hover:text-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] lg:hidden"
          type="button"
        >
          <Menu className="h-[20px] w-[20px]" />
        </motion.button>

        <div
          className={`relative flex min-w-0 max-w-[540px] flex-1 items-center rounded-2xl border transition-all duration-200 ${
            searchFocused
              ? "border-[var(--primary)]/60 bg-[#1E293B] shadow-lg shadow-[var(--primary)]/10"
              : "border-[#334155] bg-[#1E293B]/60 hover:border-[#475569] hover:bg-[#1E293B]"
          }`}
        >
          <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search members, payments, attendance..."
            // iOS Safari materializes default autocapitalize / autocorrect / spellcheck
            // attributes onto <input> DOM nodes during HTML parsing. Declare them
            // explicitly so the server HTML and the hydrated client render always match.
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            suppressHydrationWarning
            className="w-full min-w-0 bg-transparent px-3 py-2 text-[14px] text-[#F8FAFC] placeholder-[#64748B] outline-none"
          />
          <kbd className="mr-3 hidden items-center gap-1 rounded-lg border border-[#334155] bg-[#0F172A] px-2 py-0.5 text-[11px] font-medium text-[#64748B] sm:flex">
            <span>⌘</span>K
          </kbd>
        </div>
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
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-bold text-white shadow-lg shadow-[var(--primary)]/30">
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
                          n.unread ? "bg-[var(--primary)]" : "bg-[#334155]"
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
                    className="w-full rounded-xl px-3 py-2 text-center text-[12px] font-medium text-[var(--primary)] transition-colors hover:bg-[#1E293B]"
                    type="button"
                  >
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions — hidden on small screens to keep the header usable */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B]/60 text-[#64748B] transition-all hover:border-[#475569] hover:bg-[#1E293B] hover:text-[#94A3B8] sm:flex"
          type="button"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </motion.button>

        {/* User Avatar & Profile */}
        <div ref={profileRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProfile(true)}
            onPointerEnter={() => setShowProfile(true)}
            onPointerLeave={(e) => {
              // Only dismiss on a real mouse leaving — a touch tap also fires
              // pointerLeave, and closing there would make the menu unusable
              // on mobile.
              if (e.pointerType === "mouse") setShowProfile(false);
            }}
            className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#1E293B]/60 px-3 py-2 transition-all hover:border-[#475569] hover:bg-[#1E293B]"
            type="button"
          >
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-[12px] font-bold text-white shadow-sm">
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
                  {[
                    { label: "Settings", href: "/settings" },
                    { label: "Profile", href: "/profile" },
                    { label: "Logout", type: "logout" as const },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleProfileMenuClick(item)}
                      className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[#94A3B8] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global navigation drawer — mobile/tablet primary navigation */}
      <MobileNavDrawer open={isDrawerOpen} onClose={closeDrawer} />
    </motion.header>
  );
}