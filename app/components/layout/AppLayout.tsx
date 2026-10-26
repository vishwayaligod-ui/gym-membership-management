"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const publicPaths = ["/login", "/signup"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    // App shell must fill the *visible* viewport on mobile. `h-screen` (100vh) resolves
    // to the LARGE viewport on iOS Safari / Android Chrome, so when the browser toolbar
    // is visible the shell is taller than the screen. That leftover document overflow is
    // what lets touch scrolling / scroll-chaining slide the whole shell (and its sticky
    // header) up, clipping the header controls at the top. `100dvh` tracks the dynamic
    // viewport so the shell always fits exactly; `h-screen` remains as the fallback for
    // browsers without dvh support.
    <div className="flex h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-[#0F172A]">
      {/* Fixed Sidebar — desktop only (hidden on mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[250px]">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable Page Content. `overscroll-contain` stops scroll chaining to the
            document when the content reaches its end, so mobile gestures can never drag
            the app shell (and the header above it) off the top of the viewport. */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}