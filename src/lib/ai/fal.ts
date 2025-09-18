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
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[FalAI:${requestId}] Starting image generation:`, {
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    model,
    promptLength: prompt.length,
  });

  const modelName =
    model === "fast" ? config.falAI.models.fast : config.falAI.models.quality;

  // Return mock response in test environment or when API key is not configured
  if (shouldUseMockResponses()) {
    console.log(
      `[FalAI:${requestId}] Using mock responses (API keys not configured or test environment)`
    );

    // For mock responses, we'll use the mock base64 data
    const mockImageData = getMockImageData(prompt);
    console.log(`[FalAI:${requestId}] Mock image data generated:`, {
      hasData: !!mockImageData,
      dataLength: mockImageData?.length || 0,
      isDataUrl: mockImageData?.startsWith("data:") || false,
      preview: mockImageData?.substring(0, 50) + "..." || "null",
    });

    // Check if it's already a data URL (SVG)
    if (mockImageData.startsWith("data:")) {
      // For SVG data URLs, extract just the base64 part
      const base64Data = mockImageData.includes(",")
        ? mockImageData.split(",")[1]
        : mockImageData;
      console.log(`[FalAI:${requestId}] Extracted base64 from data URL:`, {
        originalLength: mockImageData.length,
        base64Length: base64Data.length,
      });

      return {
        imageData: base64Data,
        width: config.falAI.imageSize.width,
        height: config.falAI.imageSize.height,
      };
    } else {
      // For plain base64 data, use as is
      console.log(`[FalAI:${requestId}] Using plain base64 data as-is`);
      return {
        imageData: mockImageData,
        width: config.falAI.imageSize.width,
        height: config.falAI.imageSize.height,
      };
    }
  }

  try {
    console.log(
      `[FalAI:${requestId}] Using real Fal AI with model: ${modelName}`
    );
    console.log(`[FalAI:${requestId}] Configuration:`, {
      imageSize: config.falAI.imageSize,
      apiKeyConfigured: !!config.falAI.apiKey,
      apiKeyLength: config.falAI.apiKey?.length || 0,
    });

    const startTime = Date.now();
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
    const generationTime = Date.now() - startTime;

    console.log(
      `[FalAI:${requestId}] Fal AI generation completed in ${generationTime}ms:`,
      {
        hasResult: !!result,
        hasImage: !!result.image,
        imageType: typeof result.image,
        imageKeys: result.image ? Object.keys(result.image) : [],
        hasBase64: !!(result.image as any)?.base64,
        base64Length: (result.image as any)?.base64?.length || 0,
      }
    );

    // The AI SDK should return the image with base64 data
    const imageData = result.image.base64 || result.image.toString();

    console.log(`[FalAI:${requestId}] Extracted image data:`, {
      hasImageData: !!imageData,
      imageDataLength: imageData?.length || 0,
      imageDataType: typeof imageData,
      preview: imageData?.substring(0, 50) + "..." || "null",
    });

    if (!imageData || imageData.length === 0) {
      console.error(`[FalAI:${requestId}] No image data returned from Fal AI`);
      throw new Error("Fal AI returned empty image data");
    }

    const result_data = {
      imageData,
      width: config.falAI.imageSize.width,
      height: config.falAI.imageSize.height,
    };

    console.log(`[FalAI:${requestId}] Returning result:`, {
      hasImageData: !!result_data.imageData,
      imageDataLength: result_data.imageData?.length || 0,
      width: result_data.width,
      height: result_data.height,
    });

    return result_data;
  } catch (error) {
    console.error(`[FalAI:${requestId}] Fal AI generation error:`, {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Classify the error for better retry handling
    const classifiedError = classifyGenerationError(error);
    console.log(`[FalAI:${requestId}] Error classification:`, {
      retryable: classifiedError.retryable,
      retryAfter: classifiedError.retryAfter,
      type: classifiedError.type,
    });

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
