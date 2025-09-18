/**
 * AI Generation Pipeline
 * Orchestrates the full AI video generation workflow
 */

import { projectStorage } from "@/lib/storage/projects";
import { sessionStorage } from "@/lib/storage/session";
import { ProjectStatus, SceneStatus, VideoProject } from "@/types/project";
// Removed direct function imports - now using API endpoints

export interface GenerationOptions {
  useClientStorage?: boolean;
  onProgress?: (progress: GenerationProgress) => void;
  onStepComplete?: (step: GenerationStep, result: unknown) => void;
  onError?: (error: GenerationError) => void;
}

export interface GenerationProgress {
  step: GenerationStep;
  completed: number;
  total: number;
  percentage: number;
  status: string;
  currentSceneIndex?: number;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
}

export interface GenerationError {
  step: GenerationStep;
  error: Error;
  sceneIndex?: number;
  retryable: boolean;
}

export enum GenerationStep {
  TITLE = "title",
  STORYBOARD = "storyboard",
  SCENE_PROMPTS = "scene_prompts",
  IMAGES = "images",
  CACHING = "caching",
  COMPLETE = "complete",
}

export interface GenerationResult {
  success: boolean;
  projectId: string;
  errors: GenerationError[];
  timeElapsed: number;
  progress: GenerationProgress;
}

/**
 * Validates that all 4 images are generated and ready
 */
export function validateImageCompletion(project: VideoProject): boolean {
  // Must have exactly 4 scenes
  if (project.scenes.length !== 4) {
    return false;
  }

  // All scenes must be completed with valid image data
  return project.scenes.every(
    (scene) =>
      scene.status === SceneStatus.COMPLETED &&
      scene.imageData &&
      scene.imageData.length > 0
  );
}

/**
 * Enhanced generation pipeline with progress tracking and error handling
 */
export async function generateProjectContentEnhanced(
  projectId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  console.log(
    `[GenerationPipeline] Starting generation for project ${projectId}`
  );
  const startTime = Date.now();
  const errors: GenerationError[] = [];
  const {
    useClientStorage = false,
    onProgress,
    onStepComplete,
    onError,
  } = options;

  let progress: GenerationProgress = {
    step: GenerationStep.TITLE,
    completed: 0,
    total: 6, // title, storyboard, scene_prompts, images (4), caching
    percentage: 0,
    status: "Initializing...",
    timeElapsed: 0,
  };

  const updateProgress = (updates: Partial<GenerationProgress>) => {
    progress = { ...progress, ...updates, timeElapsed: Date.now() - startTime };
    if (onProgress) onProgress(progress);
  };

  const handleError = (
    step: GenerationStep,
    error: Error,
    sceneIndex?: number,
    retryable = true
  ) => {
    const genError: GenerationError = { step, error, sceneIndex, retryable };
    errors.push(genError);
    if (onError) onError(genError);
  };

  // Storage abstraction - always use client-side localStorage
  const loadProject = (id: string) => projectStorage.getProject(id);
  const saveProject = (project: VideoProject) =>
    projectStorage.saveProject(project);

  try {
    updateProgress({ status: "Loading project..." });

    // Load the project
    const project = await loadProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Record generation start
    if (useClientStorage) {
      sessionStorage.addGenerationHistory({
        id: crypto.randomUUID(),
        type: "title",
        input: { projectId, prompt: project.originalPrompt },
        output: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        success: false,
      });
    }

    // Step 1: Generate title
    console.log(
      `[GenerationPipeline] Generating title for prompt: ${project.originalPrompt}`
    );
    updateProgress({
      step: GenerationStep.TITLE,
      status: "Generating title...",
      completed: 0,
    });

    // Generate title using API or mock responses
    console.log(`[GenerationPipeline] Making API call to /api/generate/title`);
    let title: string;
    try {
      // Check if we should use mock responses
      const { shouldUseMockResponses, getMockTitle } = await import(
        "./mock-responses"
      );

      if (shouldUseMockResponses()) {
        console.log(
          `[GenerationPipeline] Using mock response for title generation`
        );
        title = getMockTitle(project.originalPrompt);
      } else {
        console.log(
          `[GenerationPipeline] Using direct AI function for title generation`
        );
        // Call the AI function directly instead of making HTTP requests
        const { generateTitle } = await import("./openrouter");
        title = await generateTitle(project.originalPrompt);
      }

      console.log(`[GenerationPipeline] Generated title: ${title}`);
    } catch (error) {
      console.error(`[GenerationPipeline] Title generation error:`, error);
      throw error;
    }

    project.title = title;
    project.updatedAt = new Date();
    await saveProject(project);

    updateProgress({ completed: 1, percentage: 17 });
    if (onStepComplete) onStepComplete(GenerationStep.TITLE, title);

    // Step 2: Generate storyboard
    updateProgress({
      step: GenerationStep.STORYBOARD,
      status: "Creating storyboard...",
    });

    // Generate storyboard using API or mock responses
    let storyboard: string;
    try {
      const { shouldUseMockResponses, getMockStoryboard } = await import(
        "./mock-responses"
      );

      if (shouldUseMockResponses()) {
        console.log(
          `[GenerationPipeline] Using mock response for storyboard generation`
        );
        storyboard = getMockStoryboard(project.originalPrompt, title);
      } else {
        console.log(
          `[GenerationPipeline] Using direct AI function for storyboard generation`
        );
        // Call the AI function directly instead of making HTTP requests
        const { generateStoryboard } = await import("./openrouter");
        storyboard = await generateStoryboard(project.originalPrompt, title);
      }

      console.log(
        `[GenerationPipeline] Generated storyboard: ${storyboard.substring(
          0,
          100
        )}...`
      );
    } catch (error) {
      console.error(`[GenerationPipeline] Storyboard generation error:`, error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Storyboard generation timed out after 30 seconds");
      }
      throw error;
    }

    project.storyboard = storyboard;
    project.updatedAt = new Date();
    await saveProject(project);

    updateProgress({ completed: 2, percentage: 33 });
    if (onStepComplete) onStepComplete(GenerationStep.STORYBOARD, storyboard);

    // Step 3: Generate scene prompts
    updateProgress({
      step: GenerationStep.SCENE_PROMPTS,
      status: "Generating scene prompts...",
    });

    // Generate scene prompts using API or mock responses
    let scenePrompts: string[];
    try {
      const { shouldUseMockResponses, getMockScenePrompts } = await import(
        "./mock-responses"
      );

      if (shouldUseMockResponses()) {
        console.log(
          `[GenerationPipeline] Using mock response for scene prompts generation`
        );
        scenePrompts = getMockScenePrompts(storyboard, title);
      } else {
        console.log(
          `[GenerationPipeline] Using direct AI function for scene prompts generation`
        );
        // Call the AI function directly instead of making HTTP requests
        const { generateScenePrompts } = await import("./openrouter");
        scenePrompts = await generateScenePrompts(storyboard, title);
      }

      console.log(
        `[GenerationPipeline] Generated ${scenePrompts.length} scene prompts`
      );
    } catch (error) {
      console.error(
        `[GenerationPipeline] Scene prompts generation error:`,
        error
      );
      throw error;
    }

    // Update scene prompts
    for (
      let i = 0;
      i < Math.min(scenePrompts.length, project.scenes.length);
      i++
    ) {
      const scene = project.scenes[i];
      const prompt = scenePrompts[i];
      if (scene && prompt) {
        scene.prompt = prompt;
      }
    }

    project.updatedAt = new Date();
    await saveProject(project);

    updateProgress({ completed: 3, percentage: 50 });
    if (onStepComplete)
      onStepComplete(GenerationStep.SCENE_PROMPTS, scenePrompts);

    // Step 4: Generate images (SEQUENTIALLY - one at a time)
    updateProgress({
      step: GenerationStep.IMAGES,
      status: "Generating scene images...",
    });

    const scenes = project.scenes.filter((scene) => scene && scene.prompt);

    // Generate images one by one in strict sequence
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneIndex = i;

      try {
        updateProgress({
          currentSceneIndex: sceneIndex,
          status: `Generating image ${sceneIndex + 1}/${scenes.length}...`,
        });

        scene.status = SceneStatus.GENERATING;
        await saveProject(project);

        // Generate image using API or mock responses
        const { shouldUseMockResponses, getMockImageData } = await import(
          "./mock-responses"
        );

        let imageResult: { imageData: string; width: number; height: number };

        if (shouldUseMockResponses()) {
          console.log(
            `[GenerationPipeline] Using mock response for image generation`
          );
          const imageData = getMockImageData(scene.prompt);
          imageResult = {
            imageData: imageData,
            width: 1024,
            height: 576,
          };
        } else {
          console.log(
            `[GenerationPipeline] Using real API for image generation`
          );
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000";
          const imageResponse = await fetch(`${baseUrl}/api/generate/image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: scene.prompt,
              model: "fast",
              sceneId: scene.id,
            }),
          });

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error(
              `[GenerationPipeline] Image API error response: ${errorText}`
            );
            throw new Error(
              `Image generation failed: ${imageResponse.status} ${imageResponse.statusText}`
            );
          }

          const imageData = await imageResponse.json();
          imageResult = {
            imageData: imageData.imageData,
            width: imageData.width,
            height: imageData.height,
          };
        }

        scene.imageData = imageResult.imageData;
        scene.status = SceneStatus.COMPLETED;
        scene.generatedAt = new Date();

        project.updatedAt = new Date();
        await saveProject(project);

        // Update progress after each image
        const imageProgress = ((i + 1) / scenes.length) * 52; // 52% for all images
        updateProgress({
          completed: 4,
          percentage: 50 + imageProgress,
          status: `Generated image ${sceneIndex + 1}/${scenes.length}`,
        });
      } catch (error) {
        scene.status = SceneStatus.FAILED;
        await saveProject(project);
        throw error;
      }
    }

    // Step 5: Final validation and completion
    updateProgress({
      step: GenerationStep.CACHING,
      status: "Finalizing...",
      completed: 5,
      percentage: 83,
    });

    // CRITICAL: Validate that ALL images are completed before marking as done
    const allImagesReady = validateImageCompletion(project);
    const anyFailed = project.scenes.some(
      (scene) => scene.status === SceneStatus.FAILED
    );

    if (!allImagesReady) {
      // If not all images are ready, this is an error condition
      throw new Error(
        "Image generation incomplete - not all images were generated successfully"
      );
    }

    if (anyFailed) {
      project.status = ProjectStatus.FAILED;
      throw new Error("Some images failed to generate");
    }

    // Only mark as completed if ALL images are ready
    project.status = ProjectStatus.COMPLETED;
    project.updatedAt = new Date();
    await saveProject(project);

    updateProgress({
      step: GenerationStep.COMPLETE,
      completed: 6,
      percentage: 100,
      status: "Generation complete!",
    });

    const timeElapsed = Date.now() - startTime;

    // Record successful generation
    if (useClientStorage) {
      sessionStorage.addGenerationHistory({
        id: crypto.randomUUID(),
        type: "storyboard",
        input: { projectId, prompt: project.originalPrompt },
        output: { title, storyboard, scenes: project.scenes.length },
        duration: timeElapsed,
        timestamp: new Date().toISOString(),
        success: true,
      });
    }

    return {
      success: true,
      projectId,
      errors,
      timeElapsed,
      progress,
    };
  } catch (error) {
    handleError(progress.step, error as Error, undefined, false);

    // Try to update project status to failed
    try {
      const project = await loadProject(projectId);
      if (project) {
        project.status = ProjectStatus.FAILED;
        project.updatedAt = new Date();
        await saveProject(project);
      }
    } catch (saveError) {
      console.error("Failed to update project status to failed:", saveError);
    }

    return {
      success: false,
      projectId,
      errors,
      timeElapsed: Date.now() - startTime,
      progress,
    };
  }
}

/**
 * Generate all AI content for a project (legacy function for backward compatibility)
 */
export async function generateProjectContent(
  projectId: string
): Promise<boolean> {
  const result = await generateProjectContentEnhanced(projectId);
  return result.success;
}

/**
 * Regenerate a specific scene
 */
export async function regenerateScene(
  projectId: string,
  sceneId: string,
  newPrompt: string
): Promise<boolean> {
  try {
    const project = await projectStorage.getProject(projectId);
    if (!project) {
      console.error("Project not found:", projectId);
      return false;
    }

    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      console.error("Scene not found:", sceneId);
      return false;
    }

    // Save edit history
    if (scene.imageData) {
      scene.editHistory.push({
        id: crypto.randomUUID(),
        prompt: newPrompt,
        previousImageData: scene.imageData,
        newImageData: "", // Will be filled after generation
        timestamp: new Date(),
      });
    }

    // Update scene
    scene.prompt = newPrompt;
    scene.status = SceneStatus.GENERATING;
    project.updatedAt = new Date();
    await projectStorage.saveProject(project);

    // Generate new image using API or mock responses
    const { shouldUseMockResponses, getMockImageData } = await import(
      "./mock-responses"
    );

    let imageResult: { imageData: string; width: number; height: number };

    if (shouldUseMockResponses()) {
      console.log(
        `[GenerationPipeline] Using mock response for image regeneration`
      );
      const imageData = getMockImageData(newPrompt);
      imageResult = {
        imageData: imageData,
        width: 1024,
        height: 576,
      };
    } else {
      console.log(`[GenerationPipeline] Using real API for image regeneration`);
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const imageResponse = await fetch(`${baseUrl}/api/generate/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: newPrompt,
          model: "fast",
          sceneId: scene.id,
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error(
          `[GenerationPipeline] Image regeneration API error response: ${errorText}`
        );
        throw new Error(
          `Image regeneration failed: ${imageResponse.status} ${imageResponse.statusText}`
        );
      }

      const imageData = await imageResponse.json();
      imageResult = {
        imageData: imageData.imageData,
        width: imageData.width,
        height: imageData.height,
      };
    }
    scene.imageData = imageResult.imageData;
    scene.status = SceneStatus.COMPLETED;
    scene.generatedAt = new Date();

    // Update edit history with new image data
    const lastEdit = scene.editHistory[scene.editHistory.length - 1];
    if (lastEdit) {
      lastEdit.newImageData = imageResult.imageData;
    }

    // Keep only last 10 edits
    if (scene.editHistory.length > 10) {
      scene.editHistory = scene.editHistory.slice(-10);
    }

    project.updatedAt = new Date();
    await projectStorage.saveProject(project);

    return true;
  } catch (error) {
    console.error("Error regenerating scene:", error);

    // Try to update scene status to failed
    try {
      const project = await projectStorage.getProject(projectId);
      if (project) {
        const scene = project.scenes.find((s) => s.id === sceneId);
        if (scene) {
          scene.status = SceneStatus.FAILED;
          await projectStorage.saveProject(project);
        }
      }
    } catch (saveError) {
      console.error("Failed to update scene status to failed:", saveError);
    }

    return false;
  }
}

/**
 * Get generation progress for a project
 */
export function getGenerationProgress(project: VideoProject): {
  completed: number;
  total: number;
  percentage: number;
  status: string;
} {
  const completed = project.scenes.filter(
    (s) => s.status === SceneStatus.COMPLETED
  ).length;
  const total = project.scenes.length;
  const percentage = Math.round((completed / total) * 100);

  let status = "Initializing";

  if (project.status === ProjectStatus.COMPLETED) {
    status = "Completed";
  } else if (project.status === ProjectStatus.FAILED) {
    status = "Failed";
  } else if (project.title && project.storyboard) {
    status = `Generating images (${completed}/${total})`;
  } else if (project.title) {
    status = "Creating storyboard";
  } else {
    status = "Generating title";
  }

  return { completed, total, percentage, status };
}
