/**
 * User Session Types
 * Based on the data model specification
 */

import { VideoProject } from "./project";

export interface UserSession {
  id: string; // Session UUID
  projects: VideoProject[]; // User's video projects
  preferences: UserPreferences; // User settings
  lastActiveAt: Date; // Last activity timestamp
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"; // Theme preference
  canvasZoom: number; // Default canvas zoom level (0.1-3.0)
  autoSave: boolean; // Auto-save preference
  notifications: NotificationSettings; // Notification preferences
}

export interface NotificationSettings {
  generationComplete: boolean; // Notify when generation completes
  errors: boolean; // Notify on errors
  tips: boolean; // Show helpful tips
}

/**
 * Default user preferences
 */
export const getDefaultUserPreferences = (): UserPreferences => ({
  theme: "system",
  canvasZoom: 1.0,
  autoSave: true,
  notifications: {
    generationComplete: true,
    errors: true,
    tips: true,
  },
});

/**
 * Create a new user session
 */
export const createUserSession = (id: string): UserSession => ({
  id,
  projects: [],
  preferences: getDefaultUserPreferences(),
  lastActiveAt: new Date(),
});

/**
 * Validation functions
 */
export const validateUserSession = (
  session: Partial<UserSession>
): string[] => {
  const errors: string[] = [];

  if (
    !session.id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      session.id
    )
  ) {
    errors.push("Invalid session ID - must be valid UUID v4");
  }

  if (!session.projects || !Array.isArray(session.projects)) {
    errors.push("Projects must be an array");
  } else if (session.projects.length > 10) {
    errors.push("Maximum 10 projects per user session");
  }

  if (!session.preferences) {
    errors.push("User preferences are required");
  } else {
    const { theme, canvasZoom } = session.preferences;

    if (!["light", "dark", "system"].includes(theme)) {
      errors.push("Theme must be light, dark, or system");
    }

    if (
      typeof canvasZoom !== "number" ||
      canvasZoom < 0.1 ||
      canvasZoom > 3.0
    ) {
      errors.push("Canvas zoom must be between 0.1 and 3.0");
    }
  }

  return errors;
};

