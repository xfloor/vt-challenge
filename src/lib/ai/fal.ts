/**
 * Fal AI Client
 * Handles image generation for scenes
 */

import { classifyGenerationError } from "@/lib/errors/generation";
import { getDefaultAIConfig } from "@/types/ai";
import { fal } from "@ai-sdk/fal";
import { experimental_generateImage as generateImageAI } from "ai";
import { getMockImageData, shouldUseMockResponses } from "./mock-responses";

const config = getDefaultAIConfig();

/**
 * Generate image from text prompt
 */
export async function generateImageFromPrompt(
  prompt: string,
  model: "fast" | "quality" = "fast"
): Promise<{ imageData: string; width: number; height: number }> {
  const modelName =
    model === "fast" ? config.falAI.models.fast : config.falAI.models.quality;

  // Return mock response in test environment or when API key is not configured
  if (shouldUseMockResponses()) {
    // For mock responses, we'll use the mock base64 data
    const mockImageData = getMockImageData(prompt);

    // Check if it's already a data URL (SVG)
    if (mockImageData.startsWith("data:")) {
      // For SVG data URLs, extract just the base64 part
      const base64Data = mockImageData.includes(",")
        ? mockImageData.split(",")[1]
        : mockImageData;
      return {
        imageData: base64Data,
        width: config.falAI.imageSize.width,
        height: config.falAI.imageSize.height,
      };
    } else {
      // For plain base64 data, use as is
      return {
        imageData: mockImageData,
        width: config.falAI.imageSize.width,
        height: config.falAI.imageSize.height,
      };
    }
  }

  try {
    const result = await generateImageAI({
      model: fal.image(modelName),
      prompt,
      maxRetries: 3, // Use AI SDK's built-in retry mechanism
      providerOptions: {
        fal: {
          image_size: "landscape_16_9",
          num_inference_steps: model === "fast" ? 4 : 8,
          enable_safety_checker: true,
        },
      },
    });

    // The AI SDK should return the image with base64 data
    const imageData = result.image.base64 || result.image.toString();

    return {
      imageData,
      width: config.falAI.imageSize.width,
      height: config.falAI.imageSize.height,
    };
  } catch (error) {
    // Classify the error for better retry handling
    const classifiedError = classifyGenerationError(error);

    // Re-throw with more context for the pipeline to handle
    const enhancedError = new Error(
      `Fal AI generation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );

    // Add retry information to the error
    (
      enhancedError as Error & {
        retryable?: boolean;
        retryAfter?: number;
        originalError?: unknown;
      }
    ).retryable = classifiedError.retryable;
    (
      enhancedError as Error & {
        retryable?: boolean;
        retryAfter?: number;
        originalError?: unknown;
      }
    ).retryAfter = classifiedError.retryAfter;
    (
      enhancedError as Error & {
        retryable?: boolean;
        retryAfter?: number;
        originalError?: unknown;
      }
    ).originalError = error;

    throw enhancedError;
  }
}

/**
 * Edit existing image with new prompt
 */
export async function editImage(
  originalImageData: string,
  editPrompt: string,
  model: "fast" | "quality" = "quality"
): Promise<{ imageData: string; width: number; height: number }> {
  // For image editing, we'll use the quality model and regenerate
  // In a real implementation, you might use img2img or specific editing models
  const enhancedPrompt = `${editPrompt}, based on the style and composition of the original image, 16:9 aspect ratio, high quality`;

  return generateImageFromPrompt(enhancedPrompt, model);
}

/**
 * Generate image from text prompt (backward compatibility wrapper)
 */
export async function generateImage(
  prompt: string,
  model: "fast" | "quality" = "fast"
): Promise<{ imageData: string; width: number; height: number }> {
  return generateImageFromPrompt(prompt, model);
}

/**
 * Check if Fal AI is properly configured
 */
export function isFalConfigured(): boolean {
  return !!config.falAI.apiKey;
}

/**
 * Get available models
 */
export function getAvailableModels() {
  return {
    fast: config.falAI.models.fast,
    quality: config.falAI.models.quality,
  };
}

// Removed unused function convertImageUrlToBase64
