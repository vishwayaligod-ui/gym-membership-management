"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { mainNavItems, bottomNavItems } from "./NavigationIcons";
import { hasPermission } from "@/lib/permissions";
import { useGymBranding } from "../useGymBranding";

import type { Variants } from "framer-motion";

const sidebarVariants: Variants = {
  hidden: { x: -250 },
  visible: {
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const itemVariants: Variants = {
  hidden: { x: -16, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.08 + i * 0.04, duration: 0.4, ease: "easeOut" },
  }),
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { gymName, gymLogo } = useGymBranding();

  const visibleMainNavItems = mainNavItems.filter((item) => {
    if (!item.resource) {
      return true;
    }

    return hasPermission(role, item.resource, item.action ?? "read");
  });

  const visibleBottomNavItems = bottomNavItems.filter((item) => {
    if (!item.resource) {
      return true;
    }

    return hasPermission(role, item.resource, item.action ?? "read");
  });

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (href === "/members") {
      return pathname.startsWith("/members") || pathname.startsWith("/members-v");
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = async (item: { href?: string; type?: "route" | "logout" }) => {
    if (item.type === "logout") {
      await signOut({
        redirectTo: "/login",
      });
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="fixed left-0 top-0 z-50 hidden h-full w-[250px] flex-col border-r border-[#334155] bg-[#111827] lg:flex"
    >
      {/* ── Logo Section ── */}
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[#334155]/40 px-4">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-lg shadow-[var(--primary)]/25">
          {gymLogo ? (
            <img src={gymLogo} alt={`${gymName} logo`} className="h-full w-full object-cover" />
          ) : (
            <Dumbbell className="h-5 w-5 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-[15px] font-bold leading-tight text-[#F8FAFC] tracking-tight">
            {gymName || "Gym"}
          </h1>
          <p className="text-[11px] font-medium text-[#94A3B8] tracking-wide">
            Management
          </p>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <div className="space-y-1">
          {visibleMainNavItems.map((item, i) => {
            const Icon = item.icon;
            const active = item.href ? isActive(item.href) : false;
            return (
              <motion.button
                key={item.label}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void handleNavClick(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] font-medium transition-all duration-200 ${
                  (item.href ? active : false)
                    ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                    : "text-[#94A3B8] hover:bg-[#1E293B]/80 hover:text-[#F8FAFC]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                    active ? "text-white" : "text-[#64748B] group-hover:text-[#94A3B8]"
                  }`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[var(--primary)]/15 text-[var(--primary)]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom Navigation ── */}
      <div className="border-t border-[#334155]/40 px-2.5 py-2.5">
        <div className="space-y-1">
          {visibleBottomNavItems.map((item, i) => {
            const Icon = item.icon;
            const active = item.href ? isActive(item.href) : false;
            return (
              <motion.button
                key={item.label}
                custom={i + 10}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void handleNavClick(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] font-medium transition-all duration-200 ${
                  (item.href ? active : false)
                    ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                    : "text-[#94A3B8] hover:bg-[#1E293B]/80 hover:text-[#F8FAFC]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                    active ? "text-white" : "text-[#64748B]"
                  }`}
                />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}