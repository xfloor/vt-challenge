import { VideoProject } from "@/types/project";
import { Scene } from "@/types/scene";
import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageSetItem,
} from "./browser-storage";
import {
  cleanupFallbackStorage,
  loadProjectFallback,
  saveProjectFallback,
  shouldUseFallbackStorage,
} from "./fallback-storage";

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
      // Try regular storage first
      const projects = await this.getProjects();
      const project = projects.find((p) => p.id === id);

      if (project) {
        return project;
      }

      // Try fallback storage
      console.log(
        `[ProjectStorage] Project ${id} not found in regular storage, trying fallback`
      );
      const fallbackProject = await loadProjectFallback(id);
      if (fallbackProject) {
        console.log(`[ProjectStorage] Project ${id} found in fallback storage`);
        return fallbackProject;
      }

      return null;
    } catch (error) {
      console.error("Failed to get project:", error);
      return null;
    }
  }

  /**
   * Save a new project or update existing one
   */
  async saveProject(project: VideoProject): Promise<boolean> {
    const projectId = project.id;
    console.log(`[ProjectStorage] Starting save for project ${projectId}`);

    try {
      // Calculate project size for debugging
      const projectSize = new Blob([JSON.stringify(project)]).size;
      const imageDataSizes = project.scenes
        .filter((scene) => scene.imageData)
        .map((scene) => ({
          sceneId: scene.id,
          size: scene.imageData?.length || 0,
          sizeKB: ((scene.imageData?.length || 0) / 1024).toFixed(2),
        }));

      console.log(`[ProjectStorage] Project size analysis:`, {
        totalSize: `${(projectSize / 1024).toFixed(2)}KB`,
        sceneCount: project.scenes.length,
        scenesWithImages: project.scenes.filter((s) => s.imageData).length,
        imageDataSizes,
      });

      // Check if we need to use fallback storage
      const useFallback = shouldUseFallbackStorage(project);
      if (useFallback) {
        console.log(
          `[ProjectStorage] Using fallback storage for large project ${projectId}`
        );
        return await this.saveProjectWithFallback(project);
      }

      const projects = await this.getProjects();
      const existingIndex = projects.findIndex((p) => p.id === project.id);

      const updatedProject = {
        ...project,
        updatedAt: new Date(),
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = updatedProject;
        console.log(
          `[ProjectStorage] Updating existing project at index ${existingIndex}`
        );
      } else {
        projects.push(updatedProject);
        console.log(`[ProjectStorage] Adding new project`);
      }

      // Save projects list
      const projectsListSaved = this.storageManager.setItem(
        PROJECTS_KEY,
        projects
      );
      if (!projectsListSaved) {
        console.error(
          `[ProjectStorage] Failed to save projects list for project ${projectId}`
        );
        return false;
      }
      console.log(`[ProjectStorage] Projects list saved successfully`);

      // Save individual project
      const individualProjectSaved = this.storageManager.setItem(
        `${PROJECT_PREFIX}${project.id}`,
        updatedProject
      );
      if (!individualProjectSaved) {
        console.error(
          `[ProjectStorage] Failed to save individual project ${projectId}`
        );
        return false;
      }
      console.log(`[ProjectStorage] Individual project saved successfully`);

      // Verify the save was successful by reading it back
      const verificationProject = await this.getProject(projectId);
      if (!verificationProject) {
        console.error(
          `[ProjectStorage] Verification failed: could not read back project ${projectId}`
        );
        return false;
      }

      // Check if all image data is preserved
      const originalImageDataCount = project.scenes.filter(
        (s) => s.imageData
      ).length;
      const savedImageDataCount = verificationProject.scenes.filter(
        (s) => s.imageData
      ).length;

      if (originalImageDataCount !== savedImageDataCount) {
        console.error(
          `[ProjectStorage] Image data count mismatch: original=${originalImageDataCount}, saved=${savedImageDataCount}`
        );
        return false;
      }

      // Check if image data sizes match
      for (let i = 0; i < project.scenes.length; i++) {
        const originalScene = project.scenes[i];
        const savedScene = verificationProject.scenes[i];

        if (originalScene.imageData && savedScene.imageData) {
          if (originalScene.imageData.length !== savedScene.imageData.length) {
            console.error(
              `[ProjectStorage] Image data size mismatch for scene ${i}: original=${originalScene.imageData.length}, saved=${savedScene.imageData.length}`
            );
            return false;
          }
        }
      }

      console.log(
        `[ProjectStorage] Project ${projectId} saved and verified successfully`
      );
      return true;
    } catch (error) {
      console.error(`[ProjectStorage] Failed to save project ${projectId}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        projectSize: `${(
          new Blob([JSON.stringify(project)]).size / 1024
        ).toFixed(2)}KB`,
      });
      return false;
    }
  }

  /**
   * Save project using fallback storage mechanism
   */
  private async saveProjectWithFallback(
    project: VideoProject
  ): Promise<boolean> {
    try {
      const projectId = project.id;
      console.log(
        `[ProjectStorage] Saving project ${projectId} with fallback storage`
      );

      // Clean up old fallback storage first
      cleanupFallbackStorage();

      // Save using fallback storage
      const fallbackSaved = await saveProjectFallback(project);
      if (!fallbackSaved) {
        console.error(
          `[ProjectStorage] Fallback storage failed for project ${projectId}`
        );
        return false;
      }

      // Update projects list to include this project (without full data)
      const projects = await this.getProjects();
      const existingIndex = projects.findIndex((p) => p.id === project.id);

      const projectSummary = {
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: new Date(),
        originalPrompt: project.originalPrompt,
        storyboard: project.storyboard,
        scenes: project.scenes.map((scene) => ({
          id: scene.id,
          status: scene.status,
          prompt: scene.prompt,
          hasImageData: !!scene.imageData,
          imageDataLength: scene.imageData?.length || 0,
        })),
        // Don't include full image data in the summary
        _fallbackStorage: true,
      };

      if (existingIndex >= 0) {
        projects[existingIndex] = projectSummary;
      } else {
        projects.push(projectSummary);
      }

      // Save the projects list
      const projectsListSaved = this.storageManager.setItem(
        PROJECTS_KEY,
        projects
      );
      if (!projectsListSaved) {
        console.error(
          `[ProjectStorage] Failed to save projects list with fallback`
        );
        return false;
      }

      console.log(
        `[ProjectStorage] Project ${projectId} saved with fallback storage successfully`
      );
      return true;
    } catch (error) {
      console.error(`[ProjectStorage] Fallback storage error:`, error);
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
