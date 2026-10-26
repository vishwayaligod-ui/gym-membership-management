"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { mainNavItems, bottomNavItems, type NavItem } from "./NavigationIcons";
import { hasPermission } from "@/lib/permissions";
import { useGymBranding } from "../useGymBranding";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Display-only section labels used to layer the drawer menu. The grouping hint
// comes from the shared navigation data (NavigationIcons),so the drawer never
// hardcodes its own copy of the nav items or their permissions.

const sectionLabels: Record<NonNullable<NavItem["section"]>, string> = {
  main: "Main",
  management: "Management",
  admin: "Admin",
};


type DrawerGroup = {
  label?: string;
  items: NavItem[];
};

const buildDrawerGroups = (items: NavItem[]): DrawerGroup[] => {
  const groups: DrawerGroup[] = [];
  let lastLabel: string | undefined;

  for (const item of items) {
    const label = item.section ? sectionLabels[item.section] : undefined;

    if (label && label !== lastLabel) {
      groups.push({ label, items: [] });
      lastLabel = label;
    }

    if (groups.length === 0) {
      groups.push({ items: [] });
    }

    groups[groups.length - 1].items.push(item);
  }

  return groups;
};

const renderSectionLabel = (label: string, className?: string) => (
  <p
    className={cn(
      "px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]",
      className
    )}
  >
    {label}
  </p>
);

// Body-portal content must not render during SSR/hydration (document is
// unavailable server-side.). This is the standard no-effect "am I hydrated yet"
// snapshot: false for the server + initial hydration render, true afterwards.

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { gymName, gymLogo } = useGymBranding();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Close on Escape (keyboard accessibility( and focus the close button when the
  // drawer opens so keyboard focus lands inside the dialog..
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);


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


  const mainGroups = buildDrawerGroups(visibleMainNavItems);
  const mainGroupOffsets: number[] = [];
let mainOffset = 0;
  for (const group of mainGroups) {
    mainGroupOffsets.push(mainOffset);
    mainOffset += group.items.length;
  }

  const accountGroups = buildDrawerGroups(visibleBottomNavItems);

  const accountGroupOffsets: number[] = [];
let accountOffset = 0;
  for (const group of accountGroups) {
    accountGroupOffsets.push(visibleMainNavItems.length + accountOffset);
    accountOffset += group.items.length;
  }


  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (href === "/members") {
      return pathname.startsWith("/members") || pathname.startsWith("/members-v");
    }
    return pathname.startsWith(href);
  };


  const handleNavClick = (item: NavItem) => {
    onClose();

    if (item.type === "logout") {
      void signOut({ redirectTo: "/login" });
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };
const renderNavItem = (item: NavItem, index: number) => {
    const Icon = item.icon;

    const active = item.href ? isActive(item.href) : false;
    return (
      <motion.button
        key={item.label}
        type="button"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04 + index * 0.035, duration: 0.2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => handleNavClick(item)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition-colors duration-200",
          active
            ? "bg-[var(--primary)]/15 text-[#F8FAFC]"
            : "text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-[#F8FAFC]"
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--primary)]"
          />
        ) : null}
        <Icon
          className={cn(
            "h-[19px] w-[19px] shrink-0 transition-colors duration-200",
            active ? "text-[var(--primary)]" : "text-[#64748B]"
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              active
                ? "bg-white/20 text-white"
                : "bg-[var(--primary)]/15 text-[var(--primary)]"
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </motion.button>
    );
  };
  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop — tapping outside the drawer closes it */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Navigation panel — slides in from the left, overlays the page */}
          <motion.aside
            key="drawer-panel"
            id="app-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-y-0 left-0 z-[61] flex w-[280px] max-w-[85vw] flex-col border-r border-[#334155] bg-[#111827] shadow-2xl shadow-black/60"
          >
            {/* Branding header + close button */}
            <div className="shrink-0 border-b border-[#334155]/40 pl-4 pr-2 pt-[env(safe-area-inset-top)]">
              <div className="flex h-[60px] items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-lg shadow-[var(--primary)]/25">
                  {gymLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gymLogo}
                      alt={`${gymName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Dumbbell className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-[15px] font-bold leading-tight text-[#F8FAFC] tracking-tight">
                    {gymName || "Gym"}
                  </h1>
                  <p className="text-[11px] font-medium text-[#94A3B8] tracking-wide">
                    Management
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation menu"
                  className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#334155] bg-[#1E293B]/60 text-[#94A3B8] transition-all hover:border-[#475569] hover:bg-[#1E293B] hover:text-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
{/* Primary module links — scroll if they exceed the viewport */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <div className="space-y-1">
                {mainGroups.map((group, groupIndex) => (
                  <div key={`main-group-${groupIndex}`} className="space-y-0.5">
                    {group.label ? renderSectionLabel(group.label, "pt-4") : null}
                    {group.items.map((item, itemIndex) => renderNavItem(item, mainGroupOffsets[groupIndex] + itemIndex))}
                  </div>
                ))}
              </div>
            </nav>

            {/* Account section — Settings / Profile / Logout */}
            <div className="shrink-0 border-t border-[#334155]/40 px-3 py-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <div className="space-y-1">
                {accountGroups.map((group, groupIndex) => (
                  <div key={`account-group-${groupIndex}`} className="space-y-0.5">
                    {group.label ? renderSectionLabel(group.label, "pt-1") : null}
                    {group.items.map((item, itemIndex) => renderNavItem(item, accountGroupOffsets[groupIndex] + itemIndex))}
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
