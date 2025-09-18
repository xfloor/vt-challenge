import { z } from "zod";

// Base validation schemas
export const baseSchemas = {
  id: z.string().uuid("Invalid ID format"),
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format"),
  date: z.string().datetime("Invalid date format"),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonEmptyString: z.string().min(1, "Cannot be empty"),
  optionalString: z.string().optional(),
  optionalNumber: z.number().optional(),
  optionalBoolean: z.boolean().optional(),
};

// Project validation schemas
export const projectSchemas = {
  create: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be less than 1000 characters")
      .trim(),
    originalPrompt: z
      .string()
      .min(10, "Original prompt must be at least 10 characters")
      .max(2000, "Original prompt must be less than 2000 characters")
      .trim(),
  }),

  update: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be less than 1000 characters")
      .trim()
      .optional(),
    originalPrompt: z
      .string()
      .min(10, "Original prompt must be at least 10 characters")
      .max(2000, "Original prompt must be less than 2000 characters")
      .trim()
      .optional(),
    status: z.enum(["generating", "completed", "failed", "editing"]).optional(),
  }),

  id: z.object({
    id: baseSchemas.id,
  }),
};

// Scene validation schemas
export const sceneSchemas = {
  create: z.object({
    prompt: z
      .string()
      .min(10, "Scene prompt must be at least 10 characters")
      .max(500, "Scene prompt must be less than 500 characters")
      .trim(),
    index: z
      .number()
      .int()
      .min(0)
      .max(3, "Scene index must be between 0 and 3"),
    canvasPosition: z.object({
      x: z.number().min(0, "X position must be non-negative"),
      y: z.number().min(0, "Y position must be non-negative"),
      width: z.number().min(100, "Width must be at least 100px"),
      height: z.number().min(56, "Height must be at least 56px"),
    }),
  }),

  update: z.object({
    prompt: z
      .string()
      .min(10, "Scene prompt must be at least 10 characters")
      .max(500, "Scene prompt must be less than 500 characters")
      .trim()
      .optional(),
    status: z
      .enum(["pending", "generating", "completed", "failed", "editing"])
      .optional(),
    imageUrl: baseSchemas.url.optional(),
    canvasPosition: z
      .object({
        x: z.number().min(0, "X position must be non-negative"),
        y: z.number().min(0, "Y position must be non-negative"),
        width: z.number().min(100, "Width must be at least 100px"),
        height: z.number().min(56, "Height must be at least 56px"),
      })
      .optional(),
  }),

  edit: z.object({
    prompt: z
      .string()
      .min(10, "Scene prompt must be at least 10 characters")
      .max(500, "Scene prompt must be less than 500 characters")
      .trim(),
  }),

  id: z.object({
    projectId: baseSchemas.id,
    sceneId: baseSchemas.id,
  }),
};

// User session validation schemas
export const sessionSchemas = {
  create: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .trim(),
    email: baseSchemas.email,
    avatar: baseSchemas.url.optional(),
  }),

  update: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .trim()
      .optional(),
    email: baseSchemas.email.optional(),
    avatar: baseSchemas.url.optional(),
    preferences: z
      .object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        autoSave: z.boolean().optional(),
        notifications: z.boolean().optional(),
        language: z
          .string()
          .min(2, "Language code must be at least 2 characters")
          .optional(),
      })
      .optional(),
  }),
};

// AI generation validation schemas
export const aiSchemas = {
  generateTitle: z.object({
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be less than 2000 characters")
      .trim(),
  }),

  generateStoryboard: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be less than 2000 characters")
      .trim(),
  }),

  generateScenePrompts: z.object({
    storyboard: z
      .array(z.string())
      .min(1, "At least one storyboard item is required"),
    projectId: baseSchemas.id,
  }),

  generateImage: z.object({
    prompt: z
      .string()
      .min(10, "Prompt must be at least 10 characters")
      .max(500, "Prompt must be less than 500 characters")
      .trim(),
    projectId: baseSchemas.id,
    sceneId: baseSchemas.id,
    style: z
      .enum(["realistic", "artistic", "cinematic", "abstract"])
      .optional(),
    quality: z.enum(["standard", "high", "ultra"]).optional(),
  }),

  generateVideo: z.object({
    projectId: baseSchemas.id,
    scenes: z
      .array(
        z.object({
          id: baseSchemas.id,
          imageUrl: baseSchemas.url,
          prompt: z.string().min(1, "Scene prompt is required"),
        })
      )
      .min(1, "At least one scene is required"),
    duration: z
      .number()
      .min(10, "Duration must be at least 10 seconds")
      .max(300, "Duration must be less than 5 minutes")
      .optional(),
    fps: z
      .number()
      .min(24, "FPS must be at least 24")
      .max(60, "FPS must be at most 60")
      .optional(),
  }),
};

// API request validation schemas
export const apiSchemas = {
  pagination: z.object({
    page: z.number().int().min(1, "Page must be at least 1").optional(),
    limit: z
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),

  search: z.object({
    query: z
      .string()
      .min(1, "Search query is required")
      .max(100, "Search query must be less than 100 characters"),
    filters: z.record(z.string(), z.any()).optional(),
  }),

  batchOperation: z.object({
    ids: z
      .array(baseSchemas.id)
      .min(1, "At least one ID is required")
      .max(100, "Maximum 100 IDs allowed"),
    operation: z.enum(["delete", "update", "export"]),
    data: z.record(z.string(), z.any()).optional(),
  }),
};

// Form validation schemas
export const formSchemas = {
  projectForm: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must be less than 1000 characters")
      .trim(),
    originalPrompt: z
      .string()
      .min(10, "Original prompt must be at least 10 characters")
      .max(2000, "Original prompt must be less than 2000 characters")
      .trim(),
  }),

  sceneForm: z.object({
    prompt: z
      .string()
      .min(10, "Scene prompt must be at least 10 characters")
      .max(500, "Scene prompt must be less than 500 characters")
      .trim(),
  }),

  userForm: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .trim(),
    email: baseSchemas.email,
    avatar: baseSchemas.url.optional(),
  }),

  settingsForm: z.object({
    theme: z.enum(["light", "dark", "system"]),
    autoSave: z.boolean(),
    notifications: z.boolean(),
    language: z.string().min(2, "Language code must be at least 2 characters"),
  }),
};

// Canvas validation schemas
export const canvasSchemas = {
  position: z.object({
    x: z.number().min(0, "X position must be non-negative"),
    y: z.number().min(0, "Y position must be non-negative"),
    width: z.number().min(100, "Width must be at least 100px"),
    height: z.number().min(56, "Height must be at least 56px"),
  }),

  transform: z.object({
    x: z.number(),
    y: z.number(),
    scale: z
      .number()
      .min(0.1, "Scale must be at least 0.1")
      .max(3, "Scale must be at most 3"),
    rotation: z
      .number()
      .min(-180, "Rotation must be at least -180 degrees")
      .max(180, "Rotation must be at most 180 degrees"),
  }),

  selection: z.object({
    startX: z.number(),
    startY: z.number(),
    endX: z.number(),
    endY: z.number(),
  }),
};

// Error validation schemas
export const errorSchemas = {
  validationError: z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
  }),

  apiError: z.object({
    message: z.string(),
    code: z.string().optional(),
    status: z.number().int().min(100).max(599),
    details: z.record(z.string(), z.any()).optional(),
  }),

  generationError: z.object({
    type: z.enum(["title", "storyboard", "scene-prompts", "image", "video"]),
    message: z.string(),
    retryable: z.boolean(),
    retryAfter: z.number().int().min(0).optional(),
  }),
};

// Utility functions for validation
export const validationUtils = {
  // Validate and transform data
  validateAndTransform: <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    return schema.parse(data);
  },

  // Safe validation that returns errors instead of throwing
  safeValidate: <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  } => {
    try {
      const result = schema.safeParse(data);
      return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success ? undefined : result.error,
      };
    } catch (error) {
      return {
        success: false,
        errors: error as z.ZodError,
      };
    }
  },

  // Get field errors from Zod error
  getFieldErrors: (error: z.ZodError): Record<string, string[]> => {
    const fieldErrors: Record<string, string[]> = {};

    error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(err.message);
    });

    return fieldErrors;
  },

  // Get first error message
  getFirstError: (error: z.ZodError): string => {
    return error.errors[0]?.message || "Validation error";
  },

  // Check if field has error
  hasFieldError: (error: z.ZodError, field: string): boolean => {
    return error.errors.some((err) => err.path.join(".") === field);
  },

  // Get error message for specific field
  getFieldError: (error: z.ZodError, field: string): string | undefined => {
    const fieldError = error.errors.find((err) => err.path.join(".") === field);
    return fieldError?.message;
  },
};

// Export all schemas
export const schemas = {
  base: baseSchemas,
  project: projectSchemas,
  scene: sceneSchemas,
  session: sessionSchemas,
  ai: aiSchemas,
  api: apiSchemas,
  form: formSchemas,
  canvas: canvasSchemas,
  error: errorSchemas,
  utils: validationUtils,
};
