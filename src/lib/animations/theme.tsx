"use client";

import { motion, Variants } from "motion/react";
import { useCallback, useEffect, useState } from "react";

export interface ThemeTransitionConfig {
  duration: number;
  ease: "easeInOut" | "easeIn" | "easeOut" | "linear";
  delay?: number;
}

export const defaultThemeTransition: ThemeTransitionConfig = {
  duration: 0.3,
  ease: "easeInOut",
  delay: 0,
};

// Simple theme transition variants for smooth animations
export const themeVariants: Record<string, Variants> = {
  // Page transitions
  page: {
    light: {
      opacity: 1,
      transition: defaultThemeTransition,
    },
    dark: {
      opacity: 1,
      transition: defaultThemeTransition,
    },
  },

  // Card transitions
  card: {
    light: {
      opacity: 1,
      scale: 1,
      transition: defaultThemeTransition,
    },
    dark: {
      opacity: 1,
      scale: 1,
      transition: defaultThemeTransition,
    },
  },

  // Button transitions
  button: {
    light: {
      opacity: 1,
      scale: 1,
      transition: defaultThemeTransition,
    },
    dark: {
      opacity: 1,
      scale: 1,
      transition: defaultThemeTransition,
    },
  },
};

// Hook for theme-aware animations
export function useThemeAnimation(theme: "light" | "dark" | "system") {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        setCurrentTheme(systemTheme);
      } else {
        setCurrentTheme(theme);
      }
    };

    updateTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [theme]);

  const getThemeVariant = useCallback(
    (component: string) => {
      return themeVariants[component]?.[currentTheme] || {};
    },
    [currentTheme]
  );

  return {
    currentTheme,
    getThemeVariant,
  };
}

// Component for smooth theme transitions
export function ThemeTransition({
  children,
  component = "page",
  className = "",
}: {
  children: React.ReactNode;
  component?: string;
  className?: string;
}) {
  const { getThemeVariant } = useThemeAnimation("system");

  return (
    <motion.div
      className={className}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      animate={getThemeVariant(component) as any}
      transition={defaultThemeTransition}
    >
      {children}
    </motion.div>
  );
}

// HOC for theme-aware components
export function withThemeTransition<P extends object>(
  Component: React.ComponentType<P>,
  componentType: string = "page"
) {
  return function ThemedComponent(props: P) {
    return (
      <ThemeTransition component={componentType}>
        <Component {...props} />
      </ThemeTransition>
    );
  };
}

// Custom hook for theme transition effects
export function useThemeTransitionEffect() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);

    // Simple transition without complex animations
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  return {
    isTransitioning,
    triggerTransition,
  };
}
