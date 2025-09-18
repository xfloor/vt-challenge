import {
  cleanupOldProjects,
  deleteProject,
  getCurrentProjectId,
  getUserSession,
  listProjects,
  loadProject,
  saveProject,
  setCurrentProject,
} from "@/lib/storage/manager";
import { ProjectStatus, VideoProject } from "@/types/project";
import { createUserSession } from "@/types/session";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Helper function to create test video projects
const createTestVideoProject = (prompt: string, id: string): VideoProject => ({
  id,
  title: `Generated Title for ${prompt}`,
  originalPrompt: prompt,
  storyboard: `Generated storyboard for ${prompt}`,
  scenes: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  status: ProjectStatus.COMPLETED,
});

// Mock localStorage - use the global mock from setup.ts
const localStorageMock = global.localStorage as any;

describe("Storage Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("getUserSession", () => {
    it("should create new session if none exists", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const session = await getUserSession();

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.projects).toEqual([]);
      expect(session.lastActiveAt).toBeInstanceOf(Date);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should load existing session from localStorage", async () => {
      const existingSession = createUserSession("test-user");
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingSession));

      const session = await getUserSession();

      expect(session.id).toBe("test-user");
      expect(session.lastActiveAt).toBeInstanceOf(Date);
    });

    it("should handle corrupted session data gracefully", async () => {
      localStorageMock.getItem.mockReturnValue("invalid-json");

      const session = await getUserSession();

      expect(session).toBeDefined();
      expect(session.projects).toEqual([]);
    });
  });

  describe("saveProject", () => {
    it("should save new project to session", async () => {
      const mockSession = createUserSession("test-user");
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const project = createTestVideoProject("Test prompt", "test-id");
      const result = await saveProject(project);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should update existing project", async () => {
      const project = createTestVideoProject("Test prompt", "test-id");
      const mockSession = createUserSession("test-user");
      mockSession.projects = [project];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const updatedProject = { ...project, title: "Updated Title" };
      const result = await saveProject(updatedProject);

      expect(result).toBe(true);
    });

    it("should limit projects to 10 most recent", async () => {
      const mockSession = createUserSession("test-user");
      // Create 10 existing projects
      mockSession.projects = Array.from({ length: 10 }, (_, i) =>
        createTestVideoProject(`Project ${i}`, `id-${i}`)
      );
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const newProject = createTestVideoProject("New Project", "new-id");
      await saveProject(newProject);

      // Should have saved session with new project at start, oldest removed
      const savedCall = localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === "vt_user_session"
      );
      expect(savedCall).toBeDefined();

      const savedSession = JSON.parse(savedCall[1]);
      expect(savedSession.projects).toHaveLength(10);
      expect(savedSession.projects[0].id).toBe("new-id");
    });
  });

  describe("loadProject", () => {
    it("should load existing project by ID", async () => {
      const project = createTestVideoProject("Test prompt", "test-id");
      const mockSession = createUserSession("test-user");
      mockSession.projects = [project];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await loadProject("test-id");

      expect(result).toEqual(project);
    });

    it("should return null for non-existent project", async () => {
      const mockSession = createUserSession("test-user");
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await loadProject("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("deleteProject", () => {
    it("should remove project from session", async () => {
      const project = createTestVideoProject("Test prompt", "test-id");
      const mockSession = createUserSession("test-user");
      mockSession.projects = [project];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await deleteProject("test-id");

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should handle deletion of non-existent project", async () => {
      const mockSession = createUserSession("test-user");
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await deleteProject("non-existent");

      expect(result).toBe(true); // Should succeed even if project doesn't exist
    });
  });

  describe("listProjects", () => {
    it("should return paginated projects", async () => {
      const projects = Array.from({ length: 15 }, (_, i) =>
        createTestVideoProject(`Project ${i}`, `id-${i}`)
      );
      const mockSession = createUserSession("test-user");
      mockSession.projects = projects;
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await listProjects(5, 0);

      expect(result.projects).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.hasMore).toBe(true);
    });

    it("should handle pagination correctly", async () => {
      const projects = Array.from({ length: 8 }, (_, i) =>
        createTestVideoProject(`Project ${i}`, `id-${i}`)
      );
      const mockSession = createUserSession("test-user");
      mockSession.projects = projects;
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      const result = await listProjects(5, 5);

      expect(result.projects).toHaveLength(3);
      expect(result.total).toBe(8);
      expect(result.hasMore).toBe(false);
    });
  });

  describe("currentProject", () => {
    it("should set and get current project ID", async () => {
      const setResult = await setCurrentProject("test-id");
      expect(setResult).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "vt_current_project",
        "test-id"
      );

      localStorageMock.getItem.mockReturnValue("test-id");
      const getResult = await getCurrentProjectId();
      expect(getResult).toBe("test-id");
    });
  });

  describe("cleanupOldProjects", () => {
    it("should remove projects older than 30 days", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 10); // 10 days ago

      const oldProject = createTestVideoProject("Old Project", "old-id");
      oldProject.createdAt = oldDate;

      const newProject = createTestVideoProject("New Project", "new-id");
      newProject.createdAt = newDate;

      const mockSession = createUserSession("test-user");
      mockSession.projects = [oldProject, newProject];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

      await cleanupOldProjects();

      const savedCall = localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === "vt_user_session"
      );
      expect(savedCall).toBeDefined();

      const savedSession = JSON.parse(savedCall[1]);
      expect(savedSession.projects).toHaveLength(1);
      expect(savedSession.projects[0].id).toBe("new-id");
    });
  });

  describe("error handling", () => {
    it("should handle localStorage errors gracefully", async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const session = await getUserSession();

      expect(session).toBeDefined();
      expect(session.projects).toEqual([]);
    });

    it("should handle save errors gracefully", async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage full");
      });

      const project = createTestVideoProject("Test", "test-id");
      const result = await saveProject(project);

      expect(result).toBe(false);
    });
  });
});
