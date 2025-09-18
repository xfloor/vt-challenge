/**
 * AI Generation Pipeline
 * Orchestrates the full AI video generation workflow
 */

import {
  getImageGenerationSummary,
  logImageDebugInfo,
  validateImageData,
} from "@/lib/debug/image-debug";
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
    console.log(
      `[GenerationPipeline] Starting image generation for ${scenes.length} scenes`
    );

    // Generate images one by one in strict sequence
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneIndex = i;
      const sceneId = crypto.randomUUID().slice(0, 8);

      try {
        console.log(
          `[GenerationPipeline:${sceneId}] Starting image generation for scene ${
            sceneIndex + 1
          }/${scenes.length}:`,
          {
            sceneId: scene.id,
            prompt:
              scene.prompt?.substring(0, 100) +
              (scene.prompt?.length > 100 ? "..." : ""),
            promptLength: scene.prompt?.length || 0,
            currentStatus: scene.status,
          }
        );

        updateProgress({
          currentSceneIndex: sceneIndex,
          status: `Generating image ${sceneIndex + 1}/${scenes.length}...`,
        });

        scene.status = SceneStatus.GENERATING;
        await saveProject(project);
        console.log(
          `[GenerationPipeline:${sceneId}] Scene status updated to GENERATING`
        );

        // Generate image using API or mock responses
        const { shouldUseMockResponses, getMockImageData } = await import(
          "./mock-responses"
        );

        let imageResult: { imageData: string; width: number; height: number };

        if (shouldUseMockResponses()) {
          console.log(
            `[GenerationPipeline:${sceneId}] Using mock response for image generation`
          );
          const imageData = getMockImageData(scene.prompt);
          console.log(
            `[GenerationPipeline:${sceneId}] Mock image data generated:`,
            {
              hasData: !!imageData,
              dataLength: imageData?.length || 0,
              preview: imageData?.substring(0, 50) + "..." || "null",
            }
          );

          imageResult = {
            imageData: imageData,
            width: 1024,
            height: 576,
          };
        } else {
          console.log(
            `[GenerationPipeline:${sceneId}] Using real API for image generation`
          );
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000";

          console.log(
            `[GenerationPipeline:${sceneId}] Making API request to: ${baseUrl}/api/generate/image`
          );
          const requestBody = {
            prompt: scene.prompt,
            model: "fast",
            sceneId: scene.id,
          };
          console.log(`[GenerationPipeline:${sceneId}] Request body:`, {
            promptLength: requestBody.prompt?.length || 0,
            model: requestBody.model,
            sceneId: requestBody.sceneId,
          });

          const imageResponse = await fetch(`${baseUrl}/api/generate/image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          console.log(
            `[GenerationPipeline:${sceneId}] API response received:`,
            {
              status: imageResponse.status,
              statusText: imageResponse.statusText,
              ok: imageResponse.ok,
              headers: Object.fromEntries(imageResponse.headers.entries()),
            }
          );

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error(
              `[GenerationPipeline:${sceneId}] Image API error response:`,
              {
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                errorText: errorText,
              }
            );
            throw new Error(
              `Image generation failed: ${imageResponse.status} ${imageResponse.statusText} - ${errorText}`
            );
          }

          const imageData = await imageResponse.json();
          console.log(`[GenerationPipeline:${sceneId}] API response parsed:`, {
            hasImageData: !!imageData.imageData,
            imageDataLength: imageData.imageData?.length || 0,
            width: imageData.width,
            height: imageData.height,
            imageDataPreview:
              imageData.imageData?.substring(0, 50) + "..." || "null",
          });

          // Validate the API response
          if (!imageData.imageData || imageData.imageData.length === 0) {
            console.error(
              `[GenerationPipeline:${sceneId}] API returned empty image data`
            );
            throw new Error("API returned empty image data");
          }

          if (
            !imageData.width ||
            !imageData.height ||
            imageData.width <= 0 ||
            imageData.height <= 0
          ) {
            console.error(
              `[GenerationPipeline:${sceneId}] API returned invalid dimensions:`,
              {
                width: imageData.width,
                height: imageData.height,
              }
            );
            throw new Error(
              `API returned invalid dimensions: ${imageData.width}x${imageData.height}`
            );
          }

          imageResult = {
            imageData: imageData.imageData,
            width: imageData.width,
            height: imageData.height,
          };
        }

        console.log(
          `[GenerationPipeline:${sceneId}] Image generation completed successfully:`,
          {
            hasImageData: !!imageResult.imageData,
            imageDataLength: imageResult.imageData?.length || 0,
            width: imageResult.width,
            height: imageResult.height,
          }
        );

        // Use debugging utilities to validate the final result
        logImageDebugInfo(`Scene-${sceneIndex + 1}`, imageResult.imageData, {
          width: imageResult.width,
          height: imageResult.height,
          sceneId: scene.id,
        });

        try {
          validateImageData(imageResult.imageData, `Scene ${sceneIndex + 1}`);
        } catch (validationError) {
          console.error(
            `[GenerationPipeline:${sceneId}] Image validation failed:`,
            validationError
          );
          throw new Error(
            `Image validation failed: ${
              validationError instanceof Error
                ? validationError.message
                : "Unknown validation error"
            }`
          );
        }

        scene.imageData = imageResult.imageData;
        scene.status = SceneStatus.COMPLETED;
        scene.generatedAt = new Date();

        console.log(
          `[GenerationPipeline:${sceneId}] Scene updated with image data:`,
          {
            sceneId: scene.id,
            status: scene.status,
            hasImageData: !!scene.imageData,
            imageDataLength: scene.imageData?.length || 0,
            generatedAt: scene.generatedAt,
          }
        );

        project.updatedAt = new Date();

        // Save project with verification
        console.log(
          `[GenerationPipeline:${sceneId}] Attempting to save project with image data`
        );
        const saveSuccess = await saveProject(project);
        if (!saveSuccess) {
          console.error(
            `[GenerationPipeline:${sceneId}] Failed to save project with image data`
          );
          throw new Error(
            `Failed to save project with image data for scene ${sceneIndex + 1}`
          );
        }

        // Verify the image was actually saved
        const verificationProject = await loadProject(projectId);
        if (!verificationProject) {
          console.error(
            `[GenerationPipeline:${sceneId}] Could not load project for verification`
          );
          throw new Error(
            `Could not verify project save for scene ${sceneIndex + 1}`
          );
        }

        const savedScene = verificationProject.scenes.find(
          (s) => s.id === scene.id
        );
        if (
          !savedScene ||
          !savedScene.imageData ||
          savedScene.imageData.length === 0
        ) {
          console.error(
            `[GenerationPipeline:${sceneId}] Image data not found in saved project:`,
            {
              sceneId: scene.id,
              hasSavedScene: !!savedScene,
              hasImageData: !!savedScene?.imageData,
              imageDataLength: savedScene?.imageData?.length || 0,
            }
          );
          throw new Error(
            `Image data not properly saved for scene ${sceneIndex + 1}`
          );
        }

        if (savedScene.imageData.length !== scene.imageData.length) {
          console.error(
            `[GenerationPipeline:${sceneId}] Image data size mismatch after save:`,
            {
              originalLength: scene.imageData.length,
              savedLength: savedScene.imageData.length,
            }
          );
          throw new Error(
            `Image data size mismatch after save for scene ${sceneIndex + 1}`
          );
        }

        console.log(
          `[GenerationPipeline:${sceneId}] Project saved and verified successfully:`,
          {
            sceneId: scene.id,
            imageDataLength: savedScene.imageData.length,
            status: savedScene.status,
          }
        );

        // Update progress after each image
        const imageProgress = ((i + 1) / scenes.length) * 52; // 52% for all images
        updateProgress({
          completed: 4,
          percentage: 50 + imageProgress,
          status: `Generated image ${sceneIndex + 1}/${scenes.length}`,
        });

        console.log(
          `[GenerationPipeline:${sceneId}] Image generation completed for scene ${
            sceneIndex + 1
          }/${scenes.length}`
        );
      } catch (error) {
        console.error(
          `[GenerationPipeline:${sceneId}] Error generating image for scene ${
            sceneIndex + 1
          }:`,
          {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            sceneId: scene.id,
            prompt:
              scene.prompt?.substring(0, 100) +
              (scene.prompt?.length > 100 ? "..." : ""),
          }
        );

        scene.status = SceneStatus.FAILED;
        await saveProject(project);
        console.log(
          `[GenerationPipeline:${sceneId}] Scene status updated to FAILED and project saved`
        );
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

    console.log(
      `[GenerationPipeline] Starting final validation for project ${projectId}`
    );

    // CRITICAL: Validate that ALL images are completed before marking as done
    const allImagesReady = validateImageCompletion(project);
    const anyFailed = project.scenes.some(
      (scene) => scene.status === SceneStatus.FAILED
    );

    // Detailed validation logging using debugging utilities
    const generationSummary = getImageGenerationSummary(project.scenes);
    console.log(`[GenerationPipeline] Final validation results:`, {
      totalScenes: project.scenes.length,
      allImagesReady,
      anyFailed,
      summary: generationSummary,
    });

    if (!allImagesReady) {
      console.error(
        `[GenerationPipeline] Image generation incomplete - validation failed`
      );
      const incompleteScenes = project.scenes.filter(
        (scene) =>
          scene.status !== SceneStatus.COMPLETED ||
          !scene.imageData ||
          scene.imageData.length === 0
      );
      console.error(
        `[GenerationPipeline] Incomplete scenes:`,
        incompleteScenes.map((scene) => ({
          id: scene.id,
          status: scene.status,
          hasImageData: !!scene.imageData,
          imageDataLength: scene.imageData?.length || 0,
        }))
      );

      throw new Error(
        "Image generation incomplete - not all images were generated successfully"
      );
    }

    if (anyFailed) {
      console.error(`[GenerationPipeline] Some images failed to generate`);
      const failedScenes = project.scenes.filter(
        (scene) => scene.status === SceneStatus.FAILED
      );
      console.error(
        `[GenerationPipeline] Failed scenes:`,
        failedScenes.map((scene) => ({
          id: scene.id,
          status: scene.status,
          prompt:
            scene.prompt?.substring(0, 100) +
            (scene.prompt?.length > 100 ? "..." : ""),
        }))
      );

      project.status = ProjectStatus.FAILED;
      throw new Error("Some images failed to generate");
    }

    console.log(`[GenerationPipeline] All images validated successfully`);

    // Final save and verification before marking as completed
    console.log(`[GenerationPipeline] Performing final save and verification`);
    const finalSaveSuccess = await saveProject(project);
    if (!finalSaveSuccess) {
      console.error(`[GenerationPipeline] Final save failed`);
      throw new Error("Failed to save project in final step");
    }

    // Final verification that all images are saved
    const finalVerificationProject = await loadProject(projectId);
    if (!finalVerificationProject) {
      console.error(
        `[GenerationPipeline] Final verification failed: could not load project`
      );
      throw new Error("Could not verify final project state");
    }

    const finalImageCount = finalVerificationProject.scenes.filter(
      (s) => s.imageData && s.imageData.length > 0
    ).length;
    if (finalImageCount !== project.scenes.length) {
      console.error(
        `[GenerationPipeline] Final verification failed: expected ${project.scenes.length} images, found ${finalImageCount}`
      );
      throw new Error(
        `Final verification failed: expected ${project.scenes.length} images, found ${finalImageCount}`
      );
    }

    console.log(
      `[GenerationPipeline] Final verification successful: all ${finalImageCount} images saved`
    );

    // Only mark as completed if ALL images are ready and saved
    project.status = ProjectStatus.COMPLETED;
    project.updatedAt = new Date();
    const completionSaveSuccess = await saveProject(project);
    if (!completionSaveSuccess) {
      console.error(`[GenerationPipeline] Failed to save completion status`);
      throw new Error("Failed to save project completion status");
    }

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

    const regenerationId = crypto.randomUUID().slice(0, 8);
    console.log(
      `[GenerationPipeline:${regenerationId}] Starting scene regeneration:`,
      {
        sceneId: scene.id,
        newPrompt:
          newPrompt.substring(0, 100) + (newPrompt.length > 100 ? "..." : ""),
        promptLength: newPrompt.length,
      }
    );

    let imageResult: { imageData: string; width: number; height: number };

    if (shouldUseMockResponses()) {
      console.log(
        `[GenerationPipeline:${regenerationId}] Using mock response for image regeneration`
      );
      const imageData = getMockImageData(newPrompt);
      logImageDebugInfo(`Regeneration-${regenerationId}`, imageData, {
        isMock: true,
      });

      imageResult = {
        imageData: imageData,
        width: 1024,
        height: 576,
      };
    } else {
      console.log(
        `[GenerationPipeline:${regenerationId}] Using real API for image regeneration`
      );
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";

      const requestBody = {
        prompt: newPrompt,
        model: "fast",
        sceneId: scene.id,
      };

      console.log(
        `[GenerationPipeline:${regenerationId}] Making regeneration request:`,
        {
          url: `${baseUrl}/api/generate/image`,
          requestBody,
        }
      );

      const imageResponse = await fetch(`${baseUrl}/api/generate/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        `[GenerationPipeline:${regenerationId}] Regeneration API response:`,
        {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          ok: imageResponse.ok,
        }
      );

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error(
          `[GenerationPipeline:${regenerationId}] Image regeneration API error response:`,
          {
            status: imageResponse.status,
            statusText: imageResponse.statusText,
            errorText,
          }
        );
        throw new Error(
          `Image regeneration failed: ${imageResponse.status} ${imageResponse.statusText} - ${errorText}`
        );
      }

      const imageData = await imageResponse.json();
      console.log(
        `[GenerationPipeline:${regenerationId}] Regeneration response parsed:`,
        {
          hasImageData: !!imageData.imageData,
          imageDataLength: imageData.imageData?.length || 0,
          width: imageData.width,
          height: imageData.height,
        }
      );

      // Validate the response
      if (!imageData.imageData || imageData.imageData.length === 0) {
        console.error(
          `[GenerationPipeline:${regenerationId}] Regeneration API returned empty image data`
        );
        throw new Error("Regeneration API returned empty image data");
      }

      if (
        !imageData.width ||
        !imageData.height ||
        imageData.width <= 0 ||
        imageData.height <= 0
      ) {
        console.error(
          `[GenerationPipeline:${regenerationId}] Regeneration API returned invalid dimensions:`,
          {
            width: imageData.width,
            height: imageData.height,
          }
        );
        throw new Error(
          `Regeneration API returned invalid dimensions: ${imageData.width}x${imageData.height}`
        );
      }

      imageResult = {
        imageData: imageData.imageData,
        width: imageData.width,
        height: imageData.height,
      };
    }

    // Use debugging utilities to validate the regeneration result
    logImageDebugInfo(`Regeneration-${regenerationId}`, imageResult.imageData, {
      width: imageResult.width,
      height: imageResult.height,
      sceneId: scene.id,
    });

    try {
      validateImageData(
        imageResult.imageData,
        `Regeneration ${regenerationId}`
      );
    } catch (validationError) {
      console.error(
        `[GenerationPipeline:${regenerationId}] Regeneration validation failed:`,
        validationError
      );
      throw new Error(
        `Regeneration validation failed: ${
          validationError instanceof Error
            ? validationError.message
            : "Unknown validation error"
        }`
      );
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

    // Save with verification
    console.log(
      `[GenerationPipeline:${regenerationId}] Saving regenerated scene`
    );
    const saveSuccess = await projectStorage.saveProject(project);
    if (!saveSuccess) {
      console.error(
        `[GenerationPipeline:${regenerationId}] Failed to save regenerated scene`
      );
      throw new Error("Failed to save regenerated scene");
    }

    // Verify the regeneration was saved
    const verificationProject = await projectStorage.getProject(projectId);
    if (!verificationProject) {
      console.error(
        `[GenerationPipeline:${regenerationId}] Could not verify regeneration save`
      );
      throw new Error("Could not verify regeneration save");
    }

    const savedScene = verificationProject.scenes.find((s) => s.id === sceneId);
    if (
      !savedScene ||
      !savedScene.imageData ||
      savedScene.imageData.length === 0
    ) {
      console.error(
        `[GenerationPipeline:${regenerationId}] Regenerated image not found in saved project`
      );
      throw new Error("Regenerated image not properly saved");
    }

    console.log(
      `[GenerationPipeline:${regenerationId}] Scene regeneration saved and verified successfully`
    );

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
