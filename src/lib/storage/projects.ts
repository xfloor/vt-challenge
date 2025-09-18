import { VideoProject } from "@/types/project";
import { Scene } from "@/types/scene";
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

const PROJECTS_KEY = "videomaker_projects";
const PROJECT_PREFIX = "videomaker_project_";

export class ProjectStorage {
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = new StorageManager();
  }

  /**
   * Get all projects from local storage
   */
  async getProjects(): Promise<VideoProject[]> {
    try {
      const projectsData =
        this.storageManager.getItem<VideoProject[]>(PROJECTS_KEY);
      return projectsData || [];
    } catch (error) {
      console.error("Failed to get projects:", error);
      return [];
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(id: string): Promise<VideoProject | null> {
    try {
      const projects = await this.getProjects();
      return projects.find((project) => project.id === id) || null;
    } catch (error) {
      console.error("Failed to get project:", error);
      return null;
    }
  }

  /**
   * Save a new project or update existing one
   */
  async saveProject(project: VideoProject): Promise<boolean> {
    try {
      const projects = await this.getProjects();
      const existingIndex = projects.findIndex((p) => p.id === project.id);

      const updatedProject = {
        ...project,
        updatedAt: new Date(),
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.push(updatedProject);
      }

      this.storageManager.setItem(PROJECTS_KEY, projects);

      // Also store individual project for faster access
      this.storageManager.setItem(
        `${PROJECT_PREFIX}${project.id}`,
        updatedProject
      );

      return true;
    } catch (error) {
      console.error("Failed to save project:", error);
      return false;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const projects = await this.getProjects();
      const filteredProjects = projects.filter((project) => project.id !== id);

      this.storageManager.setItem(PROJECTS_KEY, filteredProjects);
      this.storageManager.removeItem(`${PROJECT_PREFIX}${id}`);

      return true;
    } catch (error) {
      console.error("Failed to delete project:", error);
      return false;
    }
  }

  /**
   * Update a specific scene in a project
   */
  async updateScene(
    projectId: string,
    sceneId: string,
    sceneUpdate: Partial<Scene>
  ): Promise<boolean> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      const sceneIndex = project.scenes.findIndex(
        (scene) => scene.id === sceneId
      );
      if (sceneIndex === -1) {
        throw new Error(
          `Scene with id ${sceneId} not found in project ${projectId}`
        );
      }

      // Update the scene with only defined properties
      const currentScene = project.scenes[sceneIndex];
      if (currentScene) {
        Object.assign(currentScene, sceneUpdate);
      }

      // Save the updated project
      return await this.saveProject(project);
    } catch (error) {
      console.error("Failed to update scene:", error);
      return false;
    }
  }

  /**
   * Add a new scene to a project
   */
  async addScene(projectId: string, scene: Scene): Promise<boolean> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      project.scenes.push(scene);

      return await this.saveProject(project);
    } catch (error) {
      console.error("Failed to add scene:", error);
      return false;
    }
  }

  /**
   * Remove a scene from a project
   */
  async removeScene(projectId: string, sceneId: string): Promise<boolean> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project with id ${projectId} not found`);
      }

      project.scenes = project.scenes.filter((scene) => scene.id !== sceneId);
      return await this.saveProject(project);
    } catch (error) {
      console.error("Failed to remove scene:", error);
      return false;
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<{
    totalProjects: number;
    totalScenes: number;
    averageScenesPerProject: number;
  }> {
    try {
      const projects = await this.getProjects();
      const totalProjects = projects.length;
      const totalScenes = projects.reduce(
        (total, project) => total + project.scenes.length,
        0
      );
      const averageScenesPerProject =
        totalProjects > 0 ? totalScenes / totalProjects : 0;

      return {
        totalProjects,
        totalScenes,
        averageScenesPerProject:
          Math.round(averageScenesPerProject * 100) / 100,
      };
    } catch (error) {
      console.error("Failed to get project stats:", error);
      return {
        totalProjects: 0,
        totalScenes: 0,
        averageScenesPerProject: 0,
      };
    }
  }

  /**
   * Search projects by title or description
   */
  async searchProjects(query: string): Promise<VideoProject[]> {
    try {
      const projects = await this.getProjects();
      const lowercaseQuery = query.toLowerCase();

      return projects.filter(
        (project) =>
          project.title.toLowerCase().includes(lowercaseQuery) ||
          project.originalPrompt.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error("Failed to search projects:", error);
      return [];
    }
  }

  /**
   * Get recent projects (sorted by updatedAt)
   */
  async getRecentProjects(limit: number = 5): Promise<VideoProject[]> {
    try {
      const projects = await this.getProjects();
      return projects
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error("Failed to get recent projects:", error);
      return [];
    }
  }

  /**
   * Clear all projects (for testing or reset)
   */
  async clearAllProjects(): Promise<boolean> {
    try {
      this.storageManager.removeItem(PROJECTS_KEY);

      // Also clear individual project entries
      const projects = await this.getProjects();
      projects.forEach((project) => {
        this.storageManager.removeItem(`${PROJECT_PREFIX}${project.id}`);
      });

      return true;
    } catch (error) {
      console.error("Failed to clear projects:", error);
      return false;
    }
  }
}

// Export singleton instance
export const projectStorage = new ProjectStorage();
