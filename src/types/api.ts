/**
 * API Request/Response Types
 * Based on the OpenAPI schema
 */

import { VideoProject } from "./project";

/**
 * Base API Response
 */
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  details?: string;
  code?: string;
}

/**
 * Error Response Types
 */
export interface APIError {
  error: string;
  message: string;
  details?: string;
  code?: string;
}

export enum APIErrorType {
  VALIDATION_ERROR = "validation_error",
  NOT_FOUND = "not_found",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INTERNAL_SERVER_ERROR = "internal_server_error",
  AI_PROVIDER_ERROR = "ai_provider_error",
  NETWORK_ERROR = "network_error",
  STORAGE_ERROR = "storage_error",
}

/**
 * Generation API Types
 */
export interface GenerateTitleRequest {
  prompt: string; // 1-1000 characters
}

export interface GenerateTitleResponse {
  title: string; // 1-100 characters
}

export interface GenerateStoryboardRequest {
  prompt: string; // 1-1000 characters
  title: string; // 1-100 characters
}

export interface GenerateStoryboardResponse {
  storyboard: string; // 1-2000 characters
}

export interface GenerateScenePromptsRequest {
  storyboard: string; // 1-2000 characters
  title: string; // 1-100 characters
}

export interface GenerateScenePromptsResponse {
  prompts: string[]; // Array of 4 prompts, each 1-500 characters
}

export interface GenerateImageRequest {
  prompt: string; // 1-500 characters
  model?: "fast" | "quality"; // Default: 'fast'
  sceneId?: string; // UUID format
}

export interface GenerateImageResponse {
  imageData: string; // Base64 encoded image data
  width: number; // Image width in pixels
  height: number; // Image height in pixels
}

/**
 * Projects API Types
 */
export interface ListProjectsRequest {
  limit?: number; // 1-50, default: 10
  offset?: number; // >= 0, default: 0
}

export interface ListProjectsResponse {
  projects: VideoProject[];
  total: number;
  hasMore: boolean;
}

export interface CreateProjectRequest {
  originalPrompt: string; // 1-1000 characters
}

export interface CreateProjectResponse {
  projectId: string; // UUID format
  status: "generating";
}

export interface GetProjectResponse extends VideoProject {}

export interface UpdateProjectRequest {
  title?: string; // 1-100 characters
  scenes?: SceneUpdatePayload[];
}

export interface SceneUpdatePayload {
  id: string;
  canvasPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UpdateProjectResponse extends VideoProject {}

/**
 * Scene Edit API Types
 */
export interface EditSceneRequest {
  prompt: string; // 1-500 characters
}

export interface EditSceneResponse {
  status: "editing";
  editId: string; // UUID format
}

/**
 * Validation helpers
 */
export const validatePrompt = (
  prompt: string,
  minLength = 1,
  maxLength = 1000
): string | null => {
  if (!prompt || typeof prompt !== "string") {
    return "Prompt is required and must be a string";
  }
  if (prompt.length < minLength) {
    return `prompt must be at least ${minLength} characters`;
  }
  if (prompt.length > maxLength) {
    return `Prompt must not exceed ${maxLength} characters`;
  }
  return null;
};

export const validateUUID = (id: string): string | null => {
  if (!id || typeof id !== "string") {
    return "ID is required and must be a string";
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    return "ID must be a valid UUID v4";
  }
  return null;
};

export const validatePagination = (
  limit?: number,
  offset?: number
): string | null => {
  if (limit !== undefined) {
    if (typeof limit !== "number" || limit < 1 || limit > 50) {
      return "Limit must be a number between 1 and 50";
    }
  }
  if (offset !== undefined) {
    if (typeof offset !== "number" || offset < 0) {
      return "Offset must be a number >= 0";
    }
  }
  return null;
};

/**
 * Create standardized error responses
 */
export const createErrorResponse = (
  type: APIErrorType,
  message: string,
  details?: string
): APIError => ({
  error: type,
  message,
  details,
});

/**
 * HTTP Status Code mappings
 */
export const getStatusCodeForError = (errorType: APIErrorType): number => {
  switch (errorType) {
    case APIErrorType.VALIDATION_ERROR:
      return 400;
    case APIErrorType.NOT_FOUND:
      return 404;
    case APIErrorType.RATE_LIMIT_EXCEEDED:
      return 429;
    case APIErrorType.AI_PROVIDER_ERROR:
    case APIErrorType.NETWORK_ERROR:
    case APIErrorType.STORAGE_ERROR:
    case APIErrorType.INTERNAL_SERVER_ERROR:
    default:
      return 500;
  }
};
