"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

type MotionDivProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const FadeUp = forwardRef<HTMLDivElement, MotionDivProps & { delay?: number }>(
  ({ children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      custom={delay}
      variants={defaultVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
);

FadeUp.displayName = "FadeUp";

export const ScaleTap = forwardRef<HTMLButtonElement, HTMLMotionProps<"button"> & { children: ReactNode }>(
  ({ children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  )
);

ScaleTap.displayName = "ScaleTap";

export { motion };