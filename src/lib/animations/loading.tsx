"use client";

import { motion, Variants } from "motion/react";

// Basic loading animation variants for future use
export const loadingVariants: Record<string, Variants> = {
  // Spinner animations
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear" as const,
        repeat: Infinity,
      },
    },
  },

  // Pulse animations
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  },

  // Fade animations
  fade: {
    animate: {
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  },
};

// Simple loading spinner component using motion
export function MotionLoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "lg":
        return "h-8 w-8";
      case "xl":
        return "h-12 w-12";
      default:
        return "h-6 w-6";
    }
  };

  return (
    <motion.div
      className={`${getSizeClasses()} text-primary ${className}`}
      variants={loadingVariants.spinner}
      animate="animate"
    >
      <svg
        className="h-full w-full"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}
