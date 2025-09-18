/**
 * Keyboard Navigation Support
 * Provides keyboard interaction patterns and utilities
 */

/**
 * Common keyboard codes
 */
export const KEYBOARD_CODES = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

/**
 * Keyboard event handler types
 */
export type KeyboardHandler = (event: KeyboardEvent) => void;

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(", ");

    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Focus the first focusable element
   */
  focusFirst: (container: HTMLElement): boolean => {
    const focusableElements = focusManagement.getFocusableElements(container);
    if (focusableElements.length > 0 && focusableElements[0]) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Focus the last focusable element
   */
  focusLast: (container: HTMLElement): boolean => {
    const focusableElements = focusManagement.getFocusableElements(container);
    const lastElement = focusableElements[focusableElements.length - 1];
    if (focusableElements.length > 0 && lastElement) {
      lastElement.focus();
      return true;
    }
    return false;
  },

  /**
   * Trap focus within a container (for modals)
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = focusManagement.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (!firstFocusable || !lastFocusable) return () => {};

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== KEYBOARD_CODES.TAB) return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstFocusable.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === "function") {
      element.focus();
    }
  },
};

/**
 * Keyboard navigation patterns
 */
export const keyboardPatterns = {
  /**
   * Handle button activation (Enter/Space)
   */
  buttonActivation: (onClick: () => void): KeyboardHandler => {
    return (event: KeyboardEvent) => {
      if (
        event.key === KEYBOARD_CODES.ENTER ||
        event.key === KEYBOARD_CODES.SPACE
      ) {
        event.preventDefault();
        onClick();
      }
    };
  },

  /**
   * Handle arrow key navigation in a list
   */
  listNavigation: (
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (newIndex: number) => void,
    orientation: "vertical" | "horizontal" = "vertical"
  ): KeyboardHandler => {
    return (event: KeyboardEvent) => {
      let newIndex = currentIndex;

      if (orientation === "vertical") {
        if (event.key === KEYBOARD_CODES.ARROW_UP) {
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (event.key === KEYBOARD_CODES.ARROW_DOWN) {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
      } else {
        if (event.key === KEYBOARD_CODES.ARROW_LEFT) {
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (event.key === KEYBOARD_CODES.ARROW_RIGHT) {
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
      }

      if (event.key === KEYBOARD_CODES.HOME) {
        newIndex = 0;
      } else if (event.key === KEYBOARD_CODES.END) {
        newIndex = items.length - 1;
      }

      if (newIndex !== currentIndex) {
        event.preventDefault();
        onIndexChange(newIndex);
        if (items[newIndex]) {
          items[newIndex]!.focus();
        }
      }
    };
  },

  /**
   * Handle modal keyboard interactions
   */
  modalKeyboard: (onClose: () => void): KeyboardHandler => {
    return (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_CODES.ESCAPE) {
        event.preventDefault();
        onClose();
      }
    };
  },

  /**
   * Handle form navigation and submission
   */
  formNavigation: (onSubmit?: () => void): KeyboardHandler => {
    return (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_CODES.ENTER && onSubmit) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "TEXTAREA") {
          event.preventDefault();
          onSubmit();
        }
      }
    };
  },

  /**
   * Handle grid navigation (for scene gallery)
   */
  gridNavigation: (
    columns: number,
    totalItems: number,
    currentIndex: number,
    onIndexChange: (newIndex: number) => void
  ): KeyboardHandler => {
    return (event: KeyboardEvent) => {
      let newIndex = currentIndex;

      switch (event.key) {
        case KEYBOARD_CODES.ARROW_LEFT:
          newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
          break;
        case KEYBOARD_CODES.ARROW_RIGHT:
          newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
          break;
        case KEYBOARD_CODES.ARROW_UP:
          newIndex = currentIndex - columns;
          if (newIndex < 0) {
            newIndex =
              Math.floor((totalItems - 1) / columns) * columns +
              (currentIndex % columns);
            if (newIndex >= totalItems) {
              newIndex -= columns;
            }
          }
          break;
        case KEYBOARD_CODES.ARROW_DOWN:
          newIndex = currentIndex + columns;
          if (newIndex >= totalItems) {
            newIndex = currentIndex % columns;
          }
          break;
        case KEYBOARD_CODES.HOME:
          newIndex = 0;
          break;
        case KEYBOARD_CODES.END:
          newIndex = totalItems - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        event.preventDefault();
        onIndexChange(newIndex);
      }
    };
  },
};

/**
 * Custom hooks for keyboard interactions (React patterns)
 */
export const keyboardHooks = {
  /**
   * Use keyboard navigation for a list of items
   */
  useListKeyboard: (
    items: HTMLElement[],
    orientation: "vertical" | "horizontal" = "vertical"
  ) => {
    let currentIndex = 0;

    const handleKeyDown = keyboardPatterns.listNavigation(
      items,
      currentIndex,
      (newIndex) => {
        currentIndex = newIndex;
      },
      orientation
    );

    return {
      handleKeyDown,
      getCurrentIndex: () => currentIndex,
      setCurrentIndex: (index: number) => {
        currentIndex = Math.max(0, Math.min(items.length - 1, index));
      },
    };
  },

  /**
   * Use modal keyboard interactions
   */
  useModalKeyboard: (isOpen: boolean, onClose: () => void) => {
    let previousFocus: HTMLElement | null = null;
    let cleanupFocusTrap: (() => void) | null = null;

    const openModal = (container: HTMLElement) => {
      if (!isOpen) return;

      previousFocus = document.activeElement as HTMLElement;
      cleanupFocusTrap = focusManagement.trapFocus(container);

      const handleKeyDown = keyboardPatterns.modalKeyboard(onClose);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    };

    const closeModal = () => {
      if (cleanupFocusTrap) {
        cleanupFocusTrap();
        cleanupFocusTrap = null;
      }
      focusManagement.restoreFocus(previousFocus);
      previousFocus = null;
    };

    return { openModal, closeModal };
  },
};

/**
 * Skip links for keyboard navigation
 */
export const createSkipLink = (targetId: string, text: string) => ({
  href: `#${targetId}`,
  children: text,
  className:
    "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 rounded-md shadow-sm z-50",
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === KEYBOARD_CODES.ENTER) {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  },
});

/**
 * Announcement utility for screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: "polite" | "assertive" = "polite"
) => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
