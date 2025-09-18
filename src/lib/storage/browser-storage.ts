/**
 * Browser storage utilities with proper SSR and test environment handling
 */

/**
 * Check if localStorage is available in the current environment
 */
export function isLocalStorageAvailable(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof Storage !== "undefined" &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available in the current environment
 */
export function isSessionStorageAvailable(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof Storage !== "undefined" &&
      window.sessionStorage !== null
    );
  } catch {
    return false;
  }
}

/**
 * Safe localStorage.getItem with fallback
 */
export function safeLocalStorageGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe localStorage.setItem with fallback and detailed error reporting
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.error(`[Storage] localStorage not available for key: ${key}`);
    return false;
  }

  try {
    // Check if the value is too large
    const valueSize = new Blob([value]).size;
    const keySize = new Blob([key]).size;
    const totalSize = valueSize + keySize;

    console.log(`[Storage] Attempting to save ${key}:`, {
      valueSize: `${(valueSize / 1024).toFixed(2)}KB`,
      keySize: `${(keySize / 1024).toFixed(2)}KB`,
      totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
      isLarge: totalSize > 1024 * 1024, // > 1MB
    });

    // Most browsers have a 5-10MB limit per origin
    if (totalSize > 4 * 1024 * 1024) {
      // 4MB warning threshold
      console.warn(
        `[Storage] Large data detected for key ${key}: ${(
          totalSize / 1024
        ).toFixed(2)}KB`
      );
    }

    localStorage.setItem(key, value);

    // Verify the save was successful
    const savedValue = localStorage.getItem(key);
    if (savedValue !== value) {
      console.error(
        `[Storage] Save verification failed for key ${key}: data mismatch`
      );
      return false;
    }

    console.log(`[Storage] Successfully saved ${key}`);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      valueSize: `${(new Blob([value]).size / 1024).toFixed(2)}KB`,
      errorName: error instanceof Error ? error.name : "Unknown",
    });

    // Check if it's a quota exceeded error
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.error(
        `[Storage] Quota exceeded error for key ${key} - localStorage is full`
      );
    }

    return false;
  }
}

/**
 * Safe localStorage.removeItem with fallback
 */
export function safeLocalStorageRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get localStorage size in bytes (approximate)
 */
export function getLocalStorageSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Check if localStorage is full or near capacity
 */
export function isLocalStorageFull(): boolean {
  const size = getLocalStorageSize();
  // Most browsers have a 5-10MB limit, we'll consider 4MB as "full"
  return size > 4 * 1024 * 1024;
}
