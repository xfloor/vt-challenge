"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  includeProviders?: boolean;
  showToaster?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

interface MainProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

interface FooterProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Main layout component providing structure and responsive design
 */
export function Layout({
  children,
  className,
  includeProviders = true,
  showToaster = true,
}: LayoutProps) {
  const content = (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        "flex flex-col",
        className
      )}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
      {showToaster && <Toaster />}
    </div>
  );

  if (includeProviders) {
    return content;
  }

  return content;
}

/**
 * Header component for app navigation and branding
 */
export function LayoutHeader({ children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "py-4",
        className
      )}
    >
      <div className="container mx-auto px-4">{children}</div>
    </header>
  );
}

/**
 * Main content area with responsive padding
 */
export function LayoutMain({ children, className, padding = "md" }: MainProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <main
      className={cn(
        "flex-1 container mx-auto",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </main>
  );
}

/**
 * Footer component
 */
export function LayoutFooter({ children, className }: FooterProps) {
  return (
    <footer className={cn("border-t bg-background", "py-6 mt-auto", className)}>
      <div className="container mx-auto px-4">{children}</div>
    </footer>
  );
}

/**
 * Centered layout for focused content like forms or loading states
 */
export function CenteredLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Layout className={cn("items-center justify-center", className)}>
      <div className="w-full max-w-md mx-auto p-6">{children}</div>
    </Layout>
  );
}

/**
 * Dashboard layout with sidebar support
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}

export function DashboardLayout({
  children,
  sidebar,
  header,
  className,
  sidebarCollapsed = false,
}: DashboardLayoutProps) {
  return (
    <Layout includeProviders={false} className={className}>
      {header && <LayoutHeader>{header}</LayoutHeader>}

      <div className="flex flex-1">
        {sidebar && (
          <aside
            className={cn(
              "border-r bg-background transition-all duration-300",
              sidebarCollapsed ? "w-16" : "w-64",
              "hidden md:block" // Hide on mobile
            )}
          >
            <div className="p-4">{sidebar}</div>
          </aside>
        )}

        <div className="flex-1 flex flex-col">
          <LayoutMain padding="md">{children}</LayoutMain>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Split layout for side-by-side content
 */
interface SplitLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: "left" | "right";
  sidebarWidth?: string;
  className?: string;
}

export function SplitLayout({
  children,
  sidebar,
  sidebarPosition = "right",
  sidebarWidth = "320px",
  className,
}: SplitLayoutProps) {
  return (
    <Layout includeProviders={false}>
      <div className={cn("flex h-full", className)}>
        {sidebarPosition === "left" && (
          <aside
            style={{ width: sidebarWidth }}
            className="border-r bg-background overflow-y-auto"
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">{children}</main>

        {sidebarPosition === "right" && (
          <aside
            style={{ width: sidebarWidth }}
            className="border-l bg-background overflow-y-auto"
          >
            {sidebar}
          </aside>
        )}
      </div>
    </Layout>
  );
}

/**
 * Fullscreen layout for immersive experiences
 */
export function FullscreenLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Layout
      className={cn("h-screen overflow-hidden", className)}
      includeProviders={false}
    >
      {children}
    </Layout>
  );
}

/**
 * Modal layout overlay
 */
interface ModalLayoutProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  overlayClassName?: string;
}

export function ModalLayout({
  children,
  isOpen,
  onClose,
  className,
  overlayClassName,
}: ModalLayoutProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-background border rounded-lg shadow-lg",
          "max-w-lg w-full max-h-[90vh] overflow-y-auto",
          "m-4 p-6",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Grid layout for content organization
 */
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function GridLayout({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "md",
  className,
}: GridLayoutProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  let gridClasses = "grid";

  if (typeof columns === "number") {
    gridClasses += ` grid-cols-${columns}`;
  } else {
    if (columns.sm) gridClasses += ` grid-cols-${columns.sm}`;
    if (columns.md) gridClasses += ` md:grid-cols-${columns.md}`;
    if (columns.lg) gridClasses += ` lg:grid-cols-${columns.lg}`;
    if (columns.xl) gridClasses += ` xl:grid-cols-${columns.xl}`;
  }

  return (
    <div className={cn(gridClasses, gapClasses[gap], className)}>
      {children}
    </div>
  );
}

/**
 * Container for consistent content width and padding
 */
interface ContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: boolean;
  className?: string;
}

export function Container({
  children,
  size = "lg",
  padding = true,
  className,
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto",
        sizeClasses[size],
        padding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
}
