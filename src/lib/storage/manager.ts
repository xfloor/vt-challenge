/**
 * Local Storage Manager
 * Handles all localStorage operations with error handling and validation
 */

import { VideoProject } from "@/types/project";
import { UserSession, createUserSession } from "@/types/session";

const STORAGE_KEYS = {
  USER_SESSION: "vt_user_session",
  CURRENT_PROJECT: "vt_current_project",
  GENERATION_QUEUE: "vt_generation_queue",
} as const;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get item from localStorage
 */
function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage
 */
function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Get or create user session
 */
export async function getUserSession(): Promise<UserSession> {
  const sessionData = safeGetItem(STORAGE_KEYS.USER_SESSION);

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      // Convert date strings back to Date objects
      session.lastActiveAt = new Date(session.lastActiveAt);
      session.projects = session.projects.map((project: VideoProject) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        scenes: project.scenes.map((scene) => ({
          ...scene,
          generatedAt: new Date(scene.generatedAt),
          editHistory: scene.editHistory.map((edit) => ({
            ...edit,
            timestamp: new Date(edit.timestamp),
          })),
        })),
      }));
      return session;
    } catch (error) {
      console.error("Error parsing user session:", error);
    }
  }

  // Create new session if none exists or parsing failed
  const newSession = createUserSession(crypto.randomUUID());
  await saveUserSession(newSession);
  return newSession;
}

/**
 * Save user session to localStorage
 */
export async function saveUserSession(session: UserSession): Promise<boolean> {
  try {
    const sessionData = JSON.stringify(session);
    return safeSetItem(STORAGE_KEYS.USER_SESSION, sessionData);
  } catch (error) {
    console.error("Error saving user session:", error);
    return false;
  }
}

/**
 * Save a project to the user session
 */
export async function saveProject(project: VideoProject): Promise<boolean> {
  try {
    const session = await getUserSession();

    // Find existing project or add new one
    const existingIndex = session.projects.findIndex(
      (p) => p.id === project.id
    );
    if (existingIndex >= 0) {
      session.projects[existingIndex] = project;
    } else {
      session.projects.unshift(project); // Add to beginning
    }

    // Keep only the 10 most recent projects
    session.projects = session.projects.slice(0, 10);

    // Update session timestamp
    session.lastActiveAt = new Date();

    return await saveUserSession(session);
  } catch (error) {
    console.error("Error saving project:", error);
    return false;
  }
}

/**
 * Load a specific project by ID
 */
export async function loadProject(id: string): Promise<VideoProject | null> {
  try {
    const session = await getUserSession();
    return session.projects.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error loading project:", error);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const session = await getUserSession();
    session.projects = session.projects.filter((p) => p.id !== id);
    session.lastActiveAt = new Date();

    return await saveUserSession(session);
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
}

/**
 * List all projects with pagination
 */
export async function listProjects(
  limit: number = 10,
  offset: number = 0
): Promise<{ projects: VideoProject[]; total: number; hasMore: boolean }> {
  try {
    const session = await getUserSession();
    const total = session.projects.length;
    const projects = session.projects.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { projects, total, hasMore };
  } catch (error) {
    console.error("Error listing projects:", error);
    return { projects: [], total: 0, hasMore: false };
  }
}

/**
 * Set current active project
 */
export async function setCurrentProject(projectId: string): Promise<boolean> {
  return safeSetItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
}

/**
 * Get current active project ID
 */
export async function getCurrentProjectId(): Promise<string | null> {
  return safeGetItem(STORAGE_KEYS.CURRENT_PROJECT);
}

/**
 * Clear old projects (older than 30 days)
 */
export async function cleanupOldProjects(): Promise<void> {
  try {
    const session = await getUserSession();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    session.projects = session.projects.filter(
      (project) => project.createdAt > thirtyDaysAgo
    );

    await saveUserSession(session);
  } catch (error) {
    console.error("Error cleaning up old projects:", error);
  }
}
