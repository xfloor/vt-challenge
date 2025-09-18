/**
 * AI Provider Types
 * Based on the data model specification
 */

export interface AIProviderConfig {
  openRouter: {
    apiKey: string;
    model: string; // e.g., 'meta-llama/llama-4-scout:free'
    maxTokens: number;
    temperature: number;
  };
  falAI: {
    apiKey: string;
    models: {
      fast: string; // 'fal-ai/flux-1/schnell'
      quality: string; // 'fal-ai/nano-banana'
    };
    imageSize: {
      width: number; // 1024 for 16:9
      height: number; // 576 for 16:9
    };
  };
}

export enum GenerationType {
  PROJECT_TITLE = "project_title",
  STORYBOARD = "storyboard",
  SCENE_PROMPTS = "scene_prompts",
  SCENE_IMAGE = "scene_image",
  SCENE_EDIT = "scene_edit",
}

export enum GenerationStatus {
  QUEUED = "queued",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface GenerationRequest {
  id: string; // Request UUID
  type: GenerationType; // Type of generation
  projectId: string; // Target project
  sceneId?: string; // Target scene (for image edits)
  prompt: string; // Generation prompt
  status: GenerationStatus; // Current status
  priority: number; // Queue priority (1-10)
  createdAt: Date; // Request timestamp
  startedAt?: Date; // Generation start time
  completedAt?: Date; // Generation completion time
  error?: string; // Error message if failed
}

/**
 * Generation queue operations
 */
export interface GenerationQueue {
  requests: GenerationRequest[];
  isProcessing: boolean;
  maxConcurrent: number;
}

/**
 * AI Generation responses
 */
export interface TitleGenerationResponse {
  title: string;
}

export interface StoryboardGenerationResponse {
  storyboard: string;
}

export interface ScenePromptsGenerationResponse {
  prompts: string[]; // Array of 4 prompts
}

export interface ImageGenerationResponse {
  imageData: string; // Base64 encoded image data
  width: number;
  height: number;
}

/**
 * Default AI provider configuration
 */
export const getDefaultAIConfig = (): AIProviderConfig => ({
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: "meta-llama/llama-4-scout:free",
    maxTokens: 1000,
    temperature: 0.7,
  },
  falAI: {
    apiKey: process.env.FAL_API_KEY || "",
    models: {
      fast: "fal-ai/flux-1/schnell",
      quality: "fal-ai/nano-banana",
    },
    imageSize: {
      width: 1024,
      height: 576, // 16:9 aspect ratio
    },
  },
});

/**
 * Create a new generation request
 */
export const createGenerationRequest = (
  type: GenerationType,
  projectId: string,
  prompt: string,
  sceneId?: string
): GenerationRequest => ({
  id: crypto.randomUUID(),
  type,
  projectId,
  sceneId,
  prompt,
  status: GenerationStatus.QUEUED,
  priority: 5, // Default priority
  createdAt: new Date(),
});

/**
 * Check if a generation request is in progress
 */
export const isGenerationInProgress = (status: GenerationStatus): boolean => {
  return (
    status === GenerationStatus.QUEUED ||
    status === GenerationStatus.IN_PROGRESS
  );
};
