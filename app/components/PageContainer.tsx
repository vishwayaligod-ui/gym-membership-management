"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`mx-auto w-full max-w-6xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[56px] sm:px-6 sm:pt-[56px] lg:px-8 ${className}`.trim()}
    >
      <div className="mx-auto flex min-h-screen flex-col">{children}</div>
    </motion.main>
  );
}