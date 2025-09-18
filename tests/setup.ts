import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
process.env.OPENROUTER_API_KEY = "test-openrouter-key";
process.env.FAL_API_KEY = "test-fal-key";

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto.randomUUID for Node.js
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => "12345678-1234-4567-8901-123456789abc",
  } as Crypto;
}

// Mock localStorage for test environments
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

// Mock localStorage for Node.js environment
if (typeof window === "undefined") {
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  // Also mock window.localStorage for consistency
  Object.defineProperty(global, "window", {
    value: {
      localStorage: localStorageMock,
      sessionStorage: createLocalStorageMock(),
    },
    writable: true,
  });
}

// Mock sessionStorage for Node.js environment
if (typeof window === "undefined") {
  const sessionStorageMock = createLocalStorageMock();
  Object.defineProperty(global, "sessionStorage", {
    value: sessionStorageMock,
    writable: true,
  });
}
