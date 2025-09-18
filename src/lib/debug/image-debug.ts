/**
 * Image Debugging Utilities
 * Provides tools for debugging image generation issues
 */

export interface ImageDebugInfo {
  hasData: boolean;
  dataLength: number;
  dataType: "base64" | "data-url" | "unknown";
  isValidBase64: boolean;
  isDataUrl: boolean;
  mimeType?: string;
  preview: string;
  error?: string;
}

/**
 * Analyze image data and return debugging information
 */
export function analyzeImageData(
  imageData: string | null | undefined
): ImageDebugInfo {
  const result: ImageDebugInfo = {
    hasData: false,
    dataLength: 0,
    dataType: "unknown",
    isValidBase64: false,
    isDataUrl: false,
    preview: "null",
  };

  try {
    if (!imageData) {
      result.error = "Image data is null or undefined";
      return result;
    }

    result.hasData = true;
    result.dataLength = imageData.length;
    result.preview =
      imageData.substring(0, 50) + (imageData.length > 50 ? "..." : "");

    // Check if it's a data URL
    if (imageData.startsWith("data:")) {
      result.isDataUrl = true;
      result.dataType = "data-url";

      // Extract MIME type
      const mimeMatch = imageData.match(/^data:([^;]+);/);
      if (mimeMatch) {
        result.mimeType = mimeMatch[1];
      }

      // Extract base64 part
      const base64Part = imageData.includes(",")
        ? imageData.split(",")[1]
        : imageData;
      result.isValidBase64 = isValidBase64String(base64Part);
    } else {
      // Assume it's plain base64
      result.dataType = "base64";
      result.isValidBase64 = isValidBase64String(imageData);
    }
  } catch (error) {
    result.error =
      error instanceof Error
        ? error.message
        : "Unknown error analyzing image data";
  }

  return result;
}

/**
 * Check if a string is valid base64
 */
function isValidBase64String(str: string): boolean {
  try {
    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }

    // Try to decode it
    const decoded = atob(str);
    return decoded.length > 0;
  } catch {
    return false;
  }
}

/**
 * Log detailed image debugging information
 */
export function logImageDebugInfo(
  context: string,
  imageData: string | null | undefined,
  additionalInfo: Record<string, any> = {}
): void {
  const debugInfo = analyzeImageData(imageData);

  console.log(`[ImageDebug:${context}] Image analysis:`, {
    ...debugInfo,
    ...additionalInfo,
  });

  if (debugInfo.error) {
    console.error(`[ImageDebug:${context}] Image data error:`, debugInfo.error);
  }

  if (!debugInfo.hasData) {
    console.error(`[ImageDebug:${context}] No image data provided`);
  } else if (!debugInfo.isValidBase64) {
    console.error(`[ImageDebug:${context}] Invalid base64 data`);
  } else if (debugInfo.dataLength < 100) {
    console.warn(
      `[ImageDebug:${context}] Image data seems too short (${debugInfo.dataLength} chars)`
    );
  }
}

/**
 * Validate image data and throw descriptive error if invalid
 */
export function validateImageData(
  imageData: string | null | undefined,
  context: string = "Unknown"
): void {
  const debugInfo = analyzeImageData(imageData);

  if (!debugInfo.hasData) {
    throw new Error(`${context}: Image data is null or undefined`);
  }

  if (!debugInfo.isValidBase64) {
    throw new Error(`${context}: Invalid base64 image data`);
  }

  if (debugInfo.dataLength < 100) {
    throw new Error(
      `${context}: Image data too short (${debugInfo.dataLength} chars) - likely corrupted`
    );
  }

  if (debugInfo.dataType === "data-url" && !debugInfo.mimeType) {
    console.warn(`${context}: Data URL without MIME type detected`);
  }
}

/**
 * Get a summary of image generation status for debugging
 */
export function getImageGenerationSummary(
  scenes: Array<{
    id: string;
    status: string;
    imageData?: string | null;
    prompt?: string;
  }>
): {
  totalScenes: number;
  completedScenes: number;
  failedScenes: number;
  generatingScenes: number;
  scenesWithData: number;
  scenesWithoutData: number;
  averageDataLength: number;
  sceneDetails: Array<{
    id: string;
    status: string;
    hasData: boolean;
    dataLength: number;
    isValidData: boolean;
    promptLength: number;
  }>;
} {
  const sceneDetails = scenes.map((scene) => {
    const debugInfo = analyzeImageData(scene.imageData);
    return {
      id: scene.id,
      status: scene.status,
      hasData: debugInfo.hasData,
      dataLength: debugInfo.dataLength,
      isValidData: debugInfo.isValidBase64,
      promptLength: scene.prompt?.length || 0,
    };
  });

  const completedScenes = sceneDetails.filter(
    (s) => s.status === "completed"
  ).length;
  const failedScenes = sceneDetails.filter((s) => s.status === "failed").length;
  const generatingScenes = sceneDetails.filter(
    (s) => s.status === "generating"
  ).length;
  const scenesWithData = sceneDetails.filter((s) => s.hasData).length;
  const scenesWithoutData = sceneDetails.filter((s) => !s.hasData).length;
  const averageDataLength =
    scenesWithData > 0
      ? Math.round(
          sceneDetails
            .filter((s) => s.hasData)
            .reduce((sum, s) => sum + s.dataLength, 0) / scenesWithData
        )
      : 0;

  return {
    totalScenes: scenes.length,
    completedScenes,
    failedScenes,
    generatingScenes,
    scenesWithData,
    scenesWithoutData,
    averageDataLength,
    sceneDetails,
  };
}

