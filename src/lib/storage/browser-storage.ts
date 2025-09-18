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
 * Safe localStorage.setItem with fallback
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
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
 * Safe localStorage.clear with fallback
 */
export function safeLocalStorageClear(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe sessionStorage.getItem with fallback
 */
export function safeSessionStorageGetItem(key: string): string | null {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safe sessionStorage.setItem with fallback
 */
export function safeSessionStorageSetItem(key: string, value: string): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe sessionStorage.removeItem with fallback
 */
export function safeSessionStorageRemoveItem(key: string): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe sessionStorage.clear with fallback
 */
export function safeSessionStorageClear(): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    sessionStorage.clear();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all localStorage keys safely
 */
export function safeLocalStorageKeys(): string[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  } catch {
    return [];
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
