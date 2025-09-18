"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface ViewToggleOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface ViewToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ViewToggleOption[];
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function ViewToggle({
  value,
  onValueChange,
  options,
  className = "",
  size = "md",
  variant = "outline",
}: ViewToggleProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 px-2 text-xs";
      case "lg":
        return "h-12 px-4 text-base";
      default:
        return "h-10 px-3 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  return (
    <div
      className={cn("relative inline-flex rounded-lg bg-muted p-1", className)}
    >
      {/* Background indicator */}
      <motion.div
        className="absolute inset-y-1 bg-background rounded-md shadow-sm border"
        initial={false}
        animate={{
          x: `calc(${safeSelectedIndex * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />

      {options.map((option, index) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            className={cn(
              "relative z-10 flex items-center gap-2 transition-all duration-200",
              getSizeClasses(),
              isSelected
                ? "text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              variant === "ghost" && "hover:bg-transparent",
              variant === "outline" && "hover:bg-transparent"
            )}
            onClick={() => onValueChange(option.value)}
          >
            <Icon
              className={cn(getIconSize(), "transition-transform duration-200")}
            />
            <span className="font-medium">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

// Alternative segmented control style
interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ViewToggleOption[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SegmentedControl({
  value,
  onValueChange,
  options,
  className = "",
  size = "md",
}: SegmentedControlProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-7 text-xs";
      case "lg":
        return "h-11 text-base";
      default:
        return "h-9 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  return (
    <div
      className={cn(
        "relative inline-flex rounded-md border bg-background",
        className
      )}
    >
      {/* Background indicator */}
      <motion.div
        className="absolute inset-y-0 bg-primary rounded-md"
        initial={false}
        animate={{
          x: `calc(${safeSelectedIndex * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />

      {options.map((option, index) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 transition-all duration-200",
              getSizeClasses(),
              isSelected
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              index === 0 && "rounded-l-md",
              index === options.length - 1 && "rounded-r-md"
            )}
            onClick={() => onValueChange(option.value)}
          >
            <Icon className={cn(getIconSize())} />
            <span className="font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Icon-only toggle variant
interface IconToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ViewToggleOption[];
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export function IconToggle({
  value,
  onValueChange,
  options,
  className = "",
  size = "md",
  showLabels = false,
}: IconToggleProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 w-8 text-xs";
      case "lg":
        return "h-12 w-12 text-base";
      default:
        return "h-10 w-10 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  return (
    <div
      className={cn("relative inline-flex rounded-lg bg-muted p-1", className)}
    >
      {/* Background indicator */}
      <motion.div
        className="absolute inset-y-1 bg-background rounded-md shadow-sm border"
        initial={false}
        animate={{
          x: `calc(${safeSelectedIndex * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />

      {options.map((option, index) => {
        const Icon = option.icon;
        const isSelected = option.value === value;

        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            className={cn(
              "relative z-10 flex items-center gap-2 transition-all duration-200 hover:bg-transparent",
              getSizeClasses(),
              isSelected
                ? "text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              showLabels ? "px-3" : "px-2"
            )}
            onClick={() => onValueChange(option.value)}
            title={option.label}
          >
            <Icon className={cn(getIconSize())} />
            {showLabels && <span className="font-medium">{option.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}
