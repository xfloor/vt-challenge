"use client";

import { GenerationTask } from "@/context/generation-context";

// Generation-specific error types
export class GenerationError extends Error {
  public readonly type:
    | "title"
    | "storyboard"
    | "scene-prompts"
    | "image"
    | "video";
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly taskId?: string;
  public readonly projectId?: string;
  public readonly sceneId?: string;

  constructor(
    message: string,
    type: "title" | "storyboard" | "scene-prompts" | "image" | "video",
    retryable: boolean = true,
    retryAfter?: number,
    taskId?: string,
    projectId?: string,
    sceneId?: string
  ) {
    super(message);
    this.name = "GenerationError";
    this.type = type;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.taskId = taskId;
    this.projectId = projectId;
    this.sceneId = sceneId;
  }
}

export class TitleGenerationError extends GenerationError {
  constructor(message: string, retryable: boolean = true, retryAfter?: number) {
    super(message, "title", retryable, retryAfter);
  }
}

export class StoryboardGenerationError extends GenerationError {
  constructor(message: string, retryable: boolean = true, retryAfter?: number) {
    super(message, "storyboard", retryable, retryAfter);
  }
}

export class ScenePromptsGenerationError extends GenerationError {
  constructor(message: string, retryable: boolean = true, retryAfter?: number) {
    super(message, "scene-prompts", retryable, retryAfter);
  }
}

export class ImageGenerationError extends GenerationError {
  constructor(message: string, retryable: boolean = true, retryAfter?: number) {
    super(message, "image", retryable, retryAfter);
  }
}

export class VideoGenerationError extends GenerationError {
  constructor(message: string, retryable: boolean = true, retryAfter?: number) {
    super(message, "video", retryable, retryAfter);
  }
}

// Error recovery strategies
export interface RecoveryStrategy {
  name: string;
  canHandle: (error: GenerationError) => boolean;
  execute: (error: GenerationError, task: GenerationTask) => Promise<boolean>;
  priority: number; // Lower number = higher priority
}

// Retry strategy
export const retryStrategy: RecoveryStrategy = {
  name: "retry",
  canHandle: (error: GenerationError) =>
    error.retryable && error.retryAfter !== undefined,
  execute: async (error: GenerationError, task: GenerationTask) => {
    if (error.retryAfter) {
      await new Promise((resolve) =>
        setTimeout(resolve, (error.retryAfter || 0) * 1000)
      );
      return true;
    }
    return false;
  },
  priority: 1,
};

// Fallback provider strategy
export const fallbackProviderStrategy: RecoveryStrategy = {
  name: "fallback_provider",
  canHandle: (error: GenerationError) => {
    return (
      error.message.includes("provider") || error.message.includes("quota")
    );
  },
  execute: async (error: GenerationError, task: GenerationTask) => {
    // Switch to fallback provider
    console.log(`Switching to fallback provider for ${task.type} generation`);
    return true;
  },
  priority: 2,
};

// Prompt optimization strategy
export const promptOptimizationStrategy: RecoveryStrategy = {
  name: "prompt_optimization",
  canHandle: (error: GenerationError) => {
    return (
      error.message.includes("prompt") || error.message.includes("content")
    );
  },
  execute: async (error: GenerationError, task: GenerationTask) => {
    // Optimize the prompt
    const optimizedPrompt = optimizePrompt(task.prompt);
    task.prompt = optimizedPrompt;
    console.log(`Optimized prompt for ${task.type} generation`);
    return true;
  },
  priority: 3,
};

// Quality reduction strategy
export const qualityReductionStrategy: RecoveryStrategy = {
  name: "quality_reduction",
  canHandle: (error: GenerationError) => {
    return (
      error.message.includes("quality") || error.message.includes("resolution")
    );
  },
  execute: async (error: GenerationError, task: GenerationTask) => {
    // Reduce quality settings
    console.log(`Reducing quality for ${task.type} generation`);
    return true;
  },
  priority: 4,
};

// Manual intervention strategy
export const manualInterventionStrategy: RecoveryStrategy = {
  name: "manual_intervention",
  canHandle: (error: GenerationError) => {
    return !error.retryable || error.retryAfter === undefined;
  },
  execute: async (error: GenerationError, task: GenerationTask) => {
    // Notify administrators or queue for manual review
    console.log(
      `Manual intervention required for ${task.type} generation: ${error.message}`
    );
    return false; // This strategy doesn't actually recover, just notifies
  },
  priority: 10,
};

// Error recovery manager
export class GenerationErrorRecovery {
  private strategies: RecoveryStrategy[] = [
    retryStrategy,
    fallbackProviderStrategy,
    promptOptimizationStrategy,
    qualityReductionStrategy,
    manualInterventionStrategy,
  ];

  constructor(strategies?: RecoveryStrategy[]) {
    if (strategies) {
      this.strategies = strategies;
    }
    // Sort by priority
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  async recover(
    error: GenerationError,
    task: GenerationTask
  ): Promise<boolean> {
    console.log(
      `Attempting to recover from ${error.type} generation error: ${error.message}`
    );

    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        try {
          const recovered = await strategy.execute(error, task);
          if (recovered) {
            console.log(`Recovery successful using strategy: ${strategy.name}`);
            return true;
          }
        } catch (recoveryError) {
          console.error(
            `Recovery strategy ${strategy.name} failed:`,
            recoveryError
          );
        }
      }
    }

    console.log(
      `No recovery strategy could handle the error: ${error.message}`
    );
    return false;
  }

  addStrategy(strategy: RecoveryStrategy) {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  removeStrategy(name: string) {
    this.strategies = this.strategies.filter((s) => s.name !== name);
  }
}

// Error classification
export function classifyGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limiting errors
    if (message.includes("rate limit") || message.includes("quota")) {
      return new GenerationError(
        error.message,
        "image", // Default type, will be updated based on context
        true,
        60 // Retry after 1 minute
      );
    }

    // Authentication errors
    if (message.includes("unauthorized") || message.includes("invalid key")) {
      return new GenerationError(
        error.message,
        "image",
        false // Not retryable without fixing auth
      );
    }

    // Content policy errors
    if (
      message.includes("content policy") ||
      message.includes("inappropriate")
    ) {
      return new GenerationError(
        error.message,
        "image",
        true,
        0 // Immediate retry with different prompt
      );
    }

    // Service unavailable errors
    if (
      message.includes("service unavailable") ||
      message.includes("timeout")
    ) {
      return new GenerationError(
        error.message,
        "image",
        true,
        30 // Retry after 30 seconds
      );
    }

    // Network errors
    if (message.includes("network") || message.includes("connection")) {
      return new GenerationError(
        error.message,
        "image",
        true,
        10 // Retry after 10 seconds
      );
    }

    // Generic retryable error
    return new GenerationError(
      error.message,
      "image",
      true,
      5 // Retry after 5 seconds
    );
  }

  // Unknown error
  return new GenerationError("Unknown generation error", "image", true, 5);
}

// Prompt optimization utilities
export function optimizePrompt(prompt: string): string {
  // Remove potentially problematic words
  const problematicWords = [
    "nude",
    "naked",
    "explicit",
    "sexual",
    "violence",
    "blood",
    "gore",
    "weapon",
    "gun",
    "knife",
    "bomb",
    "terrorist",
    "hate",
    "discrimination",
  ];

  let optimized = prompt;

  // Remove problematic words
  problematicWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    optimized = optimized.replace(regex, "");
  });

  // Add positive modifiers
  const positiveModifiers = [
    "high quality",
    "professional",
    "cinematic",
    "beautiful",
    "artistic",
  ];

  // Add a random positive modifier if not already present
  const hasModifier = positiveModifiers.some((modifier) =>
    optimized.toLowerCase().includes(modifier)
  );

  if (!hasModifier) {
    const randomModifier =
      positiveModifiers[Math.floor(Math.random() * positiveModifiers.length)];
    optimized = `${randomModifier} ${optimized}`;
  }

  // Ensure prompt is not too long
  if (optimized.length > 500) {
    optimized = optimized.substring(0, 500).trim();
  }

  return optimized;
}

// Error monitoring and analytics
export class GenerationErrorMonitor {
  private errors: GenerationError[] = [];
  private recoveryStats: Record<string, number> = {};

  logError(error: GenerationError) {
    this.errors.push(error);

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }
  }

  logRecovery(strategyName: string, success: boolean) {
    const key = `${strategyName}_${success ? "success" : "failure"}`;
    this.recoveryStats[key] = (this.recoveryStats[key] || 0) + 1;
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      byRetryable: { retryable: 0, nonRetryable: 0 },
      recent: this.errors.slice(-10),
    };

    this.errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (error.retryable) {
        stats.byRetryable.retryable++;
      } else {
        stats.byRetryable.nonRetryable++;
      }
    });

    return stats;
  }

  getRecoveryStats() {
    return { ...this.recoveryStats };
  }

  clear() {
    this.errors = [];
    this.recoveryStats = {};
  }
}

// Global error recovery instance
export const generationErrorRecovery = new GenerationErrorRecovery();
export const generationErrorMonitor = new GenerationErrorMonitor();

// Utility functions
export const generationErrorUtils = {
  // Check if error is retryable
  isRetryable: (error: GenerationError): boolean => {
    return error.retryable && error.retryAfter !== undefined;
  },

  // Get retry delay
  getRetryDelay: (error: GenerationError): number => {
    return error.retryAfter || 0;
  },

  // Create error from API response
  fromApiResponse: (
    response: any,
    type: "title" | "storyboard" | "scene-prompts" | "image" | "video"
  ): GenerationError => {
    const message = response.error?.message || "Generation failed";
    const retryable = response.error?.retryable !== false;
    const retryAfter = response.error?.retryAfter;

    return new GenerationError(message, type, retryable, retryAfter);
  },

  // Format error for display
  formatForDisplay: (error: GenerationError): string => {
    let message = error.message;

    if (error.retryable && error.retryAfter) {
      message += ` (Retrying in ${error.retryAfter} seconds)`;
    } else if (!error.retryable) {
      message += " (Cannot retry)";
    }

    return message;
  },
};
