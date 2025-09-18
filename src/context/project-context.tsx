"use client";

import { Scene, SceneStatus, VideoProject } from "@/types/project";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { toast } from "sonner";

interface ProjectState {
  currentProject: VideoProject | null;
  projects: VideoProject[];
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  generationProgress: number;
}

type ProjectAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PROJECTS"; payload: VideoProject[] }
  | { type: "SET_CURRENT_PROJECT"; payload: VideoProject | null }
  | { type: "UPDATE_PROJECT"; payload: VideoProject }
  | { type: "ADD_PROJECT"; payload: VideoProject }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_GENERATION_PROGRESS"; payload: number }
  | {
      type: "UPDATE_SCENE";
      payload: { projectId: string; sceneId: string; updates: Partial<Scene> };
    }
  | { type: "ADD_SCENE"; payload: { projectId: string; scene: Scene } }
  | { type: "DELETE_SCENE"; payload: { projectId: string; sceneId: string } };

interface ProjectContextType {
  state: ProjectState;
  actions: {
    loadProjects: () => Promise<void>;
    loadProject: (id: string) => Promise<void>;
    createProject: (
      title: string,
      description: string
    ) => Promise<VideoProject | null>;
    updateProject: (project: VideoProject) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setCurrentProject: (project: VideoProject | null) => void;
    updateScene: (
      projectId: string,
      sceneId: string,
      updates: Partial<Scene>
    ) => Promise<void>;
    addScene: (projectId: string, scene: Scene) => Promise<void>;
    deleteScene: (projectId: string, sceneId: string) => Promise<void>;
    regenerateScene: (
      projectId: string,
      sceneId: string,
      newPrompt: string
    ) => Promise<void>;
    regenerateAllScenes: (projectId: string) => Promise<void>;
    clearError: () => void;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function projectReducer(
  state: ProjectState,
  action: ProjectAction
): ProjectState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_PROJECTS":
      return { ...state, projects: action.payload };

    case "SET_CURRENT_PROJECT":
      return { ...state, currentProject: action.payload };

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject:
          state.currentProject?.id === action.payload.id
            ? action.payload
            : state.currentProject,
      };

    case "ADD_PROJECT":
      return {
        ...state,
        projects: [action.payload, ...state.projects],
      };

    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        currentProject:
          state.currentProject?.id === action.payload
            ? null
            : state.currentProject,
      };

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };

    case "SET_GENERATION_PROGRESS":
      return { ...state, generationProgress: action.payload };

    case "UPDATE_SCENE":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? {
                ...project,
                scenes: project.scenes.map((scene) =>
                  scene.id === action.payload.sceneId
                    ? { ...scene, ...action.payload.updates }
                    : scene
                ),
                updatedAt: new Date(),
              }
            : project
        ),
        currentProject:
          state.currentProject?.id === action.payload.projectId
            ? {
                ...state.currentProject,
                scenes: state.currentProject.scenes.map((scene) =>
                  scene.id === action.payload.sceneId
                    ? { ...scene, ...action.payload.updates }
                    : scene
                ),
                updatedAt: new Date(),
              }
            : state.currentProject,
      };

    case "ADD_SCENE":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? {
                ...project,
                scenes: [...project.scenes, action.payload.scene],
                updatedAt: new Date(),
              }
            : project
        ),
        currentProject:
          state.currentProject?.id === action.payload.projectId
            ? {
                ...state.currentProject,
                scenes: [...state.currentProject.scenes, action.payload.scene],
                updatedAt: new Date(),
              }
            : state.currentProject,
      };

    case "DELETE_SCENE":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? {
                ...project,
                scenes: project.scenes.filter(
                  (scene) => scene.id !== action.payload.sceneId
                ),
                updatedAt: new Date(),
              }
            : project
        ),
        currentProject:
          state.currentProject?.id === action.payload.projectId
            ? {
                ...state.currentProject,
                scenes: state.currentProject.scenes.filter(
                  (scene) => scene.id !== action.payload.sceneId
                ),
                updatedAt: new Date(),
              }
            : state.currentProject,
      };

    default:
      return state;
  }
}

const initialState: ProjectState = {
  currentProject: null,
  projects: [],
  isLoading: false,
  error: null,
  isGenerating: false,
  generationProgress: 0,
};

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  const loadProjects = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // Load projects from localStorage only
      const { projectStorage } = await import("@/lib/storage/projects");
      const projects = await projectStorage.getProjects();
      dispatch({ type: "SET_PROJECTS", payload: projects });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load projects";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // Load project from localStorage only
      const { projectStorage } = await import("@/lib/storage/projects");
      const project = await projectStorage.getProject(id);

      if (!project) {
        throw new Error("Project not found");
      }

      dispatch({ type: "SET_CURRENT_PROJECT", payload: project });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load project";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createProject = useCallback(
    async (
      title: string,
      description: string
    ): Promise<VideoProject | null> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        // Create project using localStorage only
        const { projectStorage } = await import("@/lib/storage/projects");
        const { generationQueue } = await import("@/lib/ai/queue");

        // Create new project
        const projectId = crypto.randomUUID();
        const now = new Date();
        const { ProjectStatus, SceneStatus } = await import("@/types/project");

        // Default position for scenes (not used for rendering since cards are centered)
        const defaultPosition = { x: 0, y: 0, width: 300, height: 169 };

        const newProject: VideoProject = {
          id: projectId,
          title: title || "",
          originalPrompt: description,
          storyboard: "",
          scenes: [
            {
              id: crypto.randomUUID(),
              projectId,
              index: 0,
              prompt: "",
              imageData: "",
              canvasPosition: defaultPosition,
              status: SceneStatus.GENERATING,
              generatedAt: now,
              editHistory: [],
            },
            {
              id: crypto.randomUUID(),
              projectId,
              index: 1,
              prompt: "",
              imageData: "",
              canvasPosition: defaultPosition,
              status: SceneStatus.GENERATING,
              generatedAt: now,
              editHistory: [],
            },
            {
              id: crypto.randomUUID(),
              projectId,
              index: 2,
              prompt: "",
              imageData: "",
              canvasPosition: defaultPosition,
              status: SceneStatus.GENERATING,
              generatedAt: now,
              editHistory: [],
            },
            {
              id: crypto.randomUUID(),
              projectId,
              index: 3,
              prompt: "",
              imageData: "",
              canvasPosition: defaultPosition,
              status: SceneStatus.GENERATING,
              generatedAt: now,
              editHistory: [],
            },
          ],
          createdAt: now,
          updatedAt: now,
          status: ProjectStatus.GENERATING,
        };

        // Save to localStorage
        await projectStorage.saveProject(newProject);

        // Trigger AI generation
        try {
          await generationQueue.addProjectGenerationTask(projectId);
        } catch (error) {
          console.error("Failed to add generation task to queue:", error);
          newProject.status = ProjectStatus.FAILED;
          await projectStorage.saveProject(newProject);
        }

        dispatch({ type: "ADD_PROJECT", payload: newProject });
        dispatch({ type: "SET_CURRENT_PROJECT", payload: newProject });

        toast.success("Project created successfully");
        return newProject;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create project";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
        return null;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const updateProject = useCallback(async (project: VideoProject) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // Update project using localStorage only
      const { projectStorage } = await import("@/lib/storage/projects");

      // Update timestamp
      const updatedProject = {
        ...project,
        updatedAt: new Date(),
      };

      await projectStorage.saveProject(updatedProject);
      dispatch({ type: "UPDATE_PROJECT", payload: updatedProject });

      toast.success("Project updated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // Delete project using localStorage only
      const { projectStorage } = await import("@/lib/storage/projects");

      await projectStorage.deleteProject(id);
      dispatch({ type: "DELETE_PROJECT", payload: id });
      toast.success("Project deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete project";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const setCurrentProject = useCallback((project: VideoProject | null) => {
    dispatch({ type: "SET_CURRENT_PROJECT", payload: project });
  }, []);

  const updateScene = useCallback(
    async (projectId: string, sceneId: string, updates: Partial<Scene>) => {
      dispatch({
        type: "UPDATE_SCENE",
        payload: { projectId, sceneId, updates },
      });
    },
    []
  );

  const addScene = useCallback(async (projectId: string, scene: Scene) => {
    dispatch({ type: "ADD_SCENE", payload: { projectId, scene } });
  }, []);

  const deleteScene = useCallback(
    async (projectId: string, sceneId: string) => {
      dispatch({ type: "DELETE_SCENE", payload: { projectId, sceneId } });
    },
    []
  );

  const regenerateScene = useCallback(
    async (projectId: string, sceneId: string, newPrompt: string) => {
      dispatch({ type: "SET_GENERATING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        // Update scene status to editing
        dispatch({
          type: "UPDATE_SCENE",
          payload: {
            projectId,
            sceneId,
            updates: {
              prompt: newPrompt,
              status: SceneStatus.EDITING,
            },
          },
        });

        const response = await fetch(
          `/api/projects/${projectId}/scenes/${sceneId}/edit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: newPrompt }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to regenerate scene");
        }

        const data = await response.json();

        dispatch({
          type: "UPDATE_SCENE",
          payload: {
            projectId,
            sceneId,
            updates: {
              imageData: data.imageData,
              status: SceneStatus.COMPLETED,
              generatedAt: new Date(),
            },
          },
        });

        toast.success("Scene regenerated successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to regenerate scene";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        dispatch({
          type: "UPDATE_SCENE",
          payload: {
            projectId,
            sceneId,
            updates: { status: SceneStatus.FAILED },
          },
        });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_GENERATING", payload: false });
      }
    },
    []
  );

  const regenerateAllScenes = useCallback(
    async (projectId: string) => {
      const project =
        state.projects.find((p) => p.id === projectId) || state.currentProject;
      if (!project) return;

      dispatch({ type: "SET_GENERATING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        // Regenerate all scenes sequentially
        for (let i = 0; i < project.scenes.length; i++) {
          const scene = project.scenes[i];
          dispatch({
            type: "SET_GENERATION_PROGRESS",
            payload: (i / project.scenes.length) * 100,
          });

          await regenerateScene(projectId, scene.id, scene.prompt);
        }

        dispatch({ type: "SET_GENERATION_PROGRESS", payload: 100 });
        toast.success("All scenes regenerated successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to regenerate scenes";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: "SET_GENERATING", payload: false });
        dispatch({ type: "SET_GENERATION_PROGRESS", payload: 0 });
      }
    },
    [state.projects, state.currentProject, regenerateScene]
  );

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const contextValue: ProjectContextType = {
    state,
    actions: {
      loadProjects,
      loadProject,
      createProject,
      updateProject,
      deleteProject,
      setCurrentProject,
      updateScene,
      addScene,
      deleteScene,
      regenerateScene,
      regenerateAllScenes,
      clearError,
    },
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
