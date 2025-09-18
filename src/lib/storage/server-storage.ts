/**
 * Server-side storage using in-memory store (for demo purposes)
 * In production, this would use a database
 */

import { VideoProject } from "@/types/project";
import { UserSession, createUserSession } from "@/types/session";

// In-memory storage (will reset on server restart)
const projects = new Map<string, VideoProject>();
const sessions = new Map<string, UserSession>();

/**
 * Save a project (server-side)
 */
export async function saveProjectServer(
  project: VideoProject
): Promise<boolean> {
  try {
    projects.set(project.id, { ...project });
    return true;
  } catch (error) {
    console.error("Error saving project to server storage:", error);
    return false;
  }
}

/**
 * Load a project (server-side)
 */
export async function loadProjectServer(
  id: string
): Promise<VideoProject | null> {
  try {
    return projects.get(id) || null;
  } catch (error) {
    console.error("Error loading project from server storage:", error);
    return null;
  }
}

/**
 * List all projects (server-side)
 */
export async function listProjectsServer(
  limit: number = 10,
  offset: number = 0
): Promise<{ projects: VideoProject[]; total: number; hasMore: boolean }> {
  try {
    const allProjects = Array.from(projects.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allProjects.length;
    const projectsSlice = allProjects.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { projects: projectsSlice, total, hasMore };
  } catch (error) {
    console.error("Error listing projects from server storage:", error);
    return { projects: [], total: 0, hasMore: false };
  }
}

/**
 * Delete a project (server-side)
 */
export async function deleteProjectServer(id: string): Promise<boolean> {
  try {
    return projects.delete(id);
  } catch (error) {
    console.error("Error deleting project from server storage:", error);
    return false;
  }
}

/**
 * Get or create user session (server-side)
 */
export async function getUserSessionServer(
  sessionId?: string
): Promise<UserSession> {
  const id = sessionId || "default-session";

  let session = sessions.get(id);
  if (!session) {
    session = createUserSession(id);
    sessions.set(id, session);
  }

  return session;
}

/**
 * Save user session (server-side)
 */
export async function saveUserSessionServer(
  session: UserSession
): Promise<boolean> {
  try {
    sessions.set(session.id, { ...session });
    return true;
  } catch (error) {
    console.error("Error saving session to server storage:", error);
    return false;
  }
}
