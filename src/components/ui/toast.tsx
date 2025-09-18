"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { createContext, useCallback, useContext, useState } from "react";
import { Button } from "./button";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = crypto.randomUUID();
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? defaultDuration,
        dismissible: toast.dismissible ?? true,
      };

      setToasts((prevToasts) => {
        const updatedToasts = [newToast, ...prevToasts];
        return updatedToasts.slice(0, maxToasts);
      });

      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [defaultDuration, maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts } = context;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastComponentProps {
  toast: Toast;
}

function ToastComponent({ toast }: ToastComponentProps) {
  const { removeToast } = useToast();

  const typeConfig = {
    default: {
      className: "border-border bg-background text-foreground",
      icon: null,
    },
    success: {
      className:
        "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
      icon: CheckCircle,
    },
    error: {
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
      icon: AlertCircle,
    },
    warning: {
      className:
        "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
      icon: AlertTriangle,
    },
    info: {
      className:
        "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
      icon: Info,
    },
  };

  const config = typeConfig[toast.type || "default"];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border p-4 shadow-lg",
        "backdrop-blur-sm",
        config.className
      )}
    >
      <div className="flex items-start gap-3">
        {IconComponent && (
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent className="h-4 w-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-medium text-sm mb-1">{toast.title}</div>
          )}

          {toast.description && (
            <div className="text-sm opacity-90 leading-relaxed">
              {toast.description}
            </div>
          )}

          {toast.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={toast.action.onClick}
                className="h-8 text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>

        {toast.dismissible && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeToast(toast.id)}
            className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Convenience hooks for different toast types
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ title, description, type: "success" }),

    error: (title: string, description?: string) =>
      addToast({ title, description, type: "error" }),

    warning: (title: string, description?: string) =>
      addToast({ title, description, type: "warning" }),

    info: (title: string, description?: string) =>
      addToast({ title, description, type: "info" }),

    custom: (toast: Omit<Toast, "id">) => addToast(toast),
  };
}

// Toast queue for non-React contexts
class ToastQueue {
  private static instance: ToastQueue;
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];

  static getInstance(): ToastQueue {
    if (!ToastQueue.instance) {
      ToastQueue.instance = new ToastQueue();
    }
    return ToastQueue.instance;
  }

  addToast(toast: Omit<Toast, "id">): string {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      dismissible: toast.dismissible ?? true,
    };

    this.toasts = [newToast, ...this.toasts].slice(0, 5);
    this.notifyListeners();

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, newToast.duration);
    }

    return id;
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }
}

// Global toast functions for use outside React components
export const toast = {
  success: (title: string, description?: string) =>
    ToastQueue.getInstance().addToast({ title, description, type: "success" }),

  error: (title: string, description?: string) =>
    ToastQueue.getInstance().addToast({ title, description, type: "error" }),

  warning: (title: string, description?: string) =>
    ToastQueue.getInstance().addToast({ title, description, type: "warning" }),

  info: (title: string, description?: string) =>
    ToastQueue.getInstance().addToast({ title, description, type: "info" }),

  custom: (toast: Omit<Toast, "id">) =>
    ToastQueue.getInstance().addToast(toast),
};

// Hook to sync global toast queue with React state
export function useGlobalToastSync() {
  const { addToast } = useToast();

  React.useEffect(() => {
    const queue = ToastQueue.getInstance();

    const unsubscribe = queue.subscribe((toasts) => {
      // Add new toasts from global queue to React state
      toasts.forEach((toast) => {
        addToast(toast);
      });
    });

    return unsubscribe;
  }, [addToast]);
}
