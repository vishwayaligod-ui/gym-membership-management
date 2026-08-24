"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "../BottomNavigation";

const publicPaths = ["/login", "/signup"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* Fixed Sidebar — desktop only (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[250px]">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation — mobile only (hidden on desktop) */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}