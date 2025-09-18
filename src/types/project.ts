/**
 * Video Project Types
 * Based on the data model specification
 */

export enum ProjectStatus {
  GENERATING = "generating", // AI generation in progress
  COMPLETED = "completed", // All scenes generated successfully
  FAILED = "failed", // Generation failed
  EDITING = "editing", // User actively editing scenes
}

export interface VideoProject {
  id: string; // UUID v4
  title: string; // AI-generated project title (1-100 chars)
  originalPrompt: string; // User's initial input (1-1000 chars)
  storyboard: string; // AI-generated storyboard description (1-2000 chars)
  scenes: Scene[]; // Array of 4 scene objects
  createdAt: Date; // Project creation timestamp
  updatedAt: Date; // Last modification timestamp
  status: ProjectStatus; // Current generation status
}

export interface Scene {
  id: string; // UUID v4
  projectId: string; // Reference to parent VideoProject
  index: number; // Scene order (0-3)
  prompt: string; // AI-generated image prompt (1-500 chars)
  imageData: string; // Base64 encoded image data
  canvasPosition: Position; // Position in canvas workspace
  status: SceneStatus; // Current scene status
  generatedAt: Date; // When image was generated
  editHistory: SceneEdit[]; // History of user edits (max 10)
}

export enum SceneStatus {
  GENERATING = "generating", // Image being generated
  COMPLETED = "completed", // Image ready
  FAILED = "failed", // Generation failed
  EDITING = "editing", // User editing prompt
}

export interface Position {
  x: number; // X coordinate in canvas (positive)
  y: number; // Y coordinate in canvas (positive)
  width: number; // Scene width in canvas (positive)
  height: number; // Scene height in canvas (positive)
}

export interface SceneEdit {
  id: string; // Edit UUID
  prompt: string; // User's edit prompt (1-500 chars)
  previousImageData: string; // Previous image base64 data
  newImageData: string; // New image base64 data
  timestamp: Date; // When edit was made
}

/**
 * Validation functions
 */
export const validateVideoProject = (
  project: Partial<VideoProject>
): string[] => {
  const errors: string[] = [];

  if (
    !project.id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      project.id
    )
  ) {
    errors.push("Invalid project ID - must be valid UUID v4");
  }

  if (
    !project.title ||
    project.title.length < 1 ||
    project.title.length > 100
  ) {
    errors.push("Title must be between 1 and 100 characters");
  }

  if (
    !project.originalPrompt ||
    project.originalPrompt.length < 1 ||
    project.originalPrompt.length > 1000
  ) {
    errors.push("Original prompt must be between 1 and 1000 characters");
  }

  if (
    !project.storyboard ||
    project.storyboard.length < 1 ||
    project.storyboard.length > 2000
  ) {
    errors.push("Storyboard must be between 1 and 2000 characters");
  }

  if (!project.scenes || project.scenes.length !== 4) {
    errors.push("Project must have exactly 4 scenes");
  }

  if (
    !project.status ||
    !Object.values(ProjectStatus).includes(project.status)
  ) {
    errors.push("Invalid project status");
  }

  return errors;
};

export const validateScene = (scene: Partial<Scene>): string[] => {
  const errors: string[] = [];

  if (
    !scene.id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      scene.id
    )
  ) {
    errors.push("Invalid scene ID - must be valid UUID v4");
  }

  if (
    !scene.projectId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      scene.projectId
    )
  ) {
    errors.push("Invalid project ID - must be valid UUID v4");
  }

  if (scene.index === undefined || scene.index < 0 || scene.index > 3) {
    errors.push("Scene index must be between 0 and 3");
  }

  if (!scene.prompt || scene.prompt.length < 1 || scene.prompt.length > 500) {
    errors.push("Scene prompt must be between 1 and 500 characters");
  }

  if (
    !scene.imageData ||
    typeof scene.imageData !== "string" ||
    scene.imageData.length === 0
  ) {
    errors.push("Image data is required");
  }

  if (!scene.canvasPosition) {
    errors.push("Canvas position is required");
  } else {
    if (
      scene.canvasPosition.x < 0 ||
      scene.canvasPosition.y < 0 ||
      scene.canvasPosition.width <= 0 ||
      scene.canvasPosition.height <= 0
    ) {
      errors.push("Canvas position coordinates must be positive");
    }
  }

  if (!scene.status || !Object.values(SceneStatus).includes(scene.status)) {
    errors.push("Invalid scene status");
  }

  if (scene.editHistory && scene.editHistory.length > 10) {
    errors.push("Maximum 10 edits per scene allowed");
  }

  return errors;
};
