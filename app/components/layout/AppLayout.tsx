"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const publicPaths = ["/login"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = publicPaths.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-[250px] flex flex-1 flex-col">
        {/* Sticky Header */}
        <Header />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}