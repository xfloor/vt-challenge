import { UserSession } from "@/types/session";
import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageSetItem,
} from "./browser-storage";

class StorageManager {
  getItem<T>(key: string): T | null {
    const data = safeLocalStorageGetItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      return safeLocalStorageSetItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  }

  removeItem(key: string): boolean {
    return safeLocalStorageRemoveItem(key);
  }
}

const SESSION_KEY = "videomaker_session";
const SETTINGS_KEY = "videomaker_settings";
const ONBOARDING_KEY = "videomaker_onboarding";

interface AppSettings {
  theme: "light" | "dark" | "system";
  canvasZoom: number;
  autoSave: boolean;
  videoQuality: "low" | "medium" | "high";
  animationSpeed: "slow" | "normal" | "fast";
  debugMode: boolean;
  language: string;
  notifications: {
    generationComplete: boolean;
    errors: boolean;
    tips: boolean;
  };
}

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skippedSteps: number[];
  completedAt?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  canvasZoom: 1.0,
  autoSave: true,
  videoQuality: "medium",
  animationSpeed: "normal",
  debugMode: false,
  language: "en",
  notifications: {
    generationComplete: true,
    errors: true,
    tips: false,
  },
};

const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  currentStep: 0,
  skippedSteps: [],
};

export class SessionStorage {
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * Get current user session
   */
  getSession(): UserSession | null {
    try {
      return this.storageManager.getItem<UserSession>(SESSION_KEY);
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  }

  /**
   * Save user session
   */
  saveSession(session: UserSession): boolean {
    try {
      const sessionWithTimestamp = {
        ...session,
        lastActiveAt: new Date(),
      };

      this.storageManager.setItem(SESSION_KEY, sessionWithTimestamp);
      return true;
    } catch (error) {
      console.error("Failed to save session:", error);
      return false;
    }
  }

  /**
   * Update session data partially
   */
  updateSession(updates: Partial<UserSession>): boolean {
    try {
      const currentSession = this.getSession();
      if (!currentSession) {
        console.warn("No session to update");
        return false;
      }

      const updatedSession = {
        ...currentSession,
        ...updates,
        lastActiveAt: new Date(),
      };

      return this.saveSession(updatedSession);
    } catch (error) {
      console.error("Failed to update session:", error);
      return false;
    }
  }

  /**
   * Clear current session
   */
  clearSession(): boolean {
    try {
      this.storageManager.removeItem(SESSION_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear session:", error);
      return false;
    }
  }

  /**
   * Check if session is active and valid
   */
  isSessionActive(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check if session has expired (24 hours)
    const lastActivity = new Date(session.lastActiveAt);
    const now = new Date();
    const hoursSinceActivity =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    return hoursSinceActivity < 24;
  }

  /**
   * Get app settings
   */
  getSettings(): AppSettings {
    try {
      const settings = this.storageManager.getItem<AppSettings>(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...settings };
    } catch (error) {
      console.error("Failed to get settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save app settings
   */
  saveSettings(settings: Partial<AppSettings>): boolean {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      this.storageManager.setItem(SETTINGS_KEY, updatedSettings);
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  }

  /**
   * Reset settings to default
   */
  resetSettings(): boolean {
    try {
      this.storageManager.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
      return true;
    } catch (error) {
      console.error("Failed to reset settings:", error);
      return false;
    }
  }

  /**
   * Get onboarding state
   */
  getOnboardingState(): OnboardingState {
    try {
      const state =
        this.storageManager.getItem<OnboardingState>(ONBOARDING_KEY);
      return { ...DEFAULT_ONBOARDING, ...state };
    } catch (error) {
      console.error("Failed to get onboarding state:", error);
      return DEFAULT_ONBOARDING;
    }
  }

  /**
   * Update onboarding state
   */
  updateOnboardingState(updates: Partial<OnboardingState>): boolean {
    try {
      const currentState = this.getOnboardingState();
      const updatedState = { ...currentState, ...updates };

      if (updates.completed && !currentState.completed) {
        updatedState.completedAt = new Date().toISOString();
      }

      this.storageManager.setItem(ONBOARDING_KEY, updatedState);
      return true;
    } catch (error) {
      console.error("Failed to update onboarding state:", error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  completeOnboarding(): boolean {
    return this.updateOnboardingState({
      completed: true,
      currentStep: -1,
    });
  }

  /**
   * Reset onboarding state
   */
  resetOnboarding(): boolean {
    try {
      this.storageManager.removeItem(ONBOARDING_KEY);
      return true;
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
      return false;
    }
  }

  /**
   * Initialize new session
   */
  initializeSession(userId?: string): UserSession {
    const session: UserSession = {
      id:
        userId ||
        `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projects: [],
      preferences: this.getSettings(),
      lastActiveAt: new Date(),
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Export all session data
   */
  exportData(): {
    session: UserSession | null;
    settings: AppSettings;
    onboarding: OnboardingState;
  } {
    return {
      session: this.getSession(),
      settings: this.getSettings(),
      onboarding: this.getOnboardingState(),
    };
  }

  /**
   * Import session data
   */
  importData(data: {
    session?: UserSession;
    settings?: AppSettings;
    onboarding?: OnboardingState;
  }): boolean {
    try {
      if (data.session) {
        this.saveSession(data.session);
      }

      if (data.settings) {
        this.saveSettings(data.settings);
      }

      if (data.onboarding) {
        this.updateOnboardingState(data.onboarding);
      }

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  /**
   * Clear all session data
   */
  clearAllData(): boolean {
    try {
      this.clearSession();
      this.resetSettings();
      this.resetOnboarding();
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  }
}

// Export singleton instance
export const sessionStorage = new SessionStorage();
