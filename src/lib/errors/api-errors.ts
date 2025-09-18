"use client";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Custom error classes
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message, 400, "VALIDATION_ERROR");
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT");
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message: string = "Service unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

// Error response interface
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
    details?: Record<string, any>;
    fieldErrors?: Record<string, string[]>;
    timestamp: string;
    path?: string;
  };
}

// Error handler function
export function handleApiError(
  error: unknown,
  request?: NextRequest
): NextResponse<ErrorResponse> {
  console.error("API Error:", error);

  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const field = err.path.join(".");
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(err.message);
    });
    apiError = new ValidationError("Validation failed", fieldErrors);
  } else if (error instanceof Error) {
    apiError = new ApiError(error.message, 500, "INTERNAL_ERROR");
  } else {
    apiError = new ApiError(
      "An unexpected error occurred",
      500,
      "INTERNAL_ERROR"
    );
  }

  const errorResponse: ErrorResponse = {
    error: {
      message: apiError.message,
      code: apiError.code,
      status: apiError.status,
      details: apiError.details,
      fieldErrors:
        apiError instanceof ValidationError ? apiError.fieldErrors : undefined,
      timestamp: new Date().toISOString(),
      path: request?.url,
    },
  };

  return NextResponse.json(errorResponse, { status: apiError.status });
}

// Validation error handler
export function handleValidationError(
  error: z.ZodError
): NextResponse<ErrorResponse> {
  const fieldErrors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const field = err.path.join(".");
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(err.message);
  });

  const validationError = new ValidationError("Validation failed", fieldErrors);
  return handleApiError(validationError);
}

// Async error wrapper
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw error;
    }
  };
}

// Error boundary for API routes
export function createErrorHandler() {
  return (error: unknown, request?: NextRequest) => {
    return handleApiError(error, request);
  };
}

// Specific error handlers for different scenarios
export const errorHandlers = {
  // Database errors
  database: (error: unknown): ApiError => {
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return new ConflictError("Resource already exists");
      }
      if (error.message.includes("foreign key")) {
        return new ValidationError("Invalid reference");
      }
      if (error.message.includes("not found")) {
        return new NotFoundError("Resource not found");
      }
    }
    return new ApiError("Database error", 500, "DATABASE_ERROR");
  },

  // Authentication errors
  auth: (error: unknown): ApiError => {
    if (error instanceof Error) {
      if (error.message.includes("invalid token")) {
        return new UnauthorizedError("Invalid authentication token");
      }
      if (error.message.includes("expired")) {
        return new UnauthorizedError("Authentication token expired");
      }
      if (error.message.includes("insufficient permissions")) {
        return new ForbiddenError("Insufficient permissions");
      }
    }
    return new UnauthorizedError("Authentication failed");
  },

  // File upload errors
  fileUpload: (error: unknown): ApiError => {
    if (error instanceof Error) {
      if (error.message.includes("file too large")) {
        return new ValidationError("File size exceeds limit");
      }
      if (error.message.includes("invalid file type")) {
        return new ValidationError("Invalid file type");
      }
      if (error.message.includes("upload failed")) {
        return new ApiError("File upload failed", 500, "UPLOAD_ERROR");
      }
    }
    return new ApiError("File upload error", 500, "UPLOAD_ERROR");
  },

  // AI generation errors
  aiGeneration: (error: unknown): ApiError => {
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return new RateLimitError("AI generation rate limit exceeded");
      }
      if (error.message.includes("quota exceeded")) {
        return new RateLimitError("AI generation quota exceeded");
      }
      if (error.message.includes("invalid prompt")) {
        return new ValidationError("Invalid generation prompt");
      }
      if (error.message.includes("service unavailable")) {
        return new ServiceUnavailableError("AI generation service unavailable");
      }
    }
    return new ApiError("AI generation failed", 500, "AI_GENERATION_ERROR");
  },

  // Network errors
  network: (error: unknown): ApiError => {
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return new ApiError("Request timeout", 408, "TIMEOUT");
      }
      if (error.message.includes("network")) {
        return new ServiceUnavailableError("Network error");
      }
    }
    return new ServiceUnavailableError("Network error");
  },
};

// Error logging utility
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", errorInfo);
  }

  // In production, you might want to send to a logging service
  // e.g., Sentry, LogRocket, etc.
}

// Error recovery utilities
export const errorRecovery = {
  // Retry with exponential backoff
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },

  // Circuit breaker pattern
  createCircuitBreaker: (threshold: number = 5, timeout: number = 60000) => {
    let failures = 0;
    let lastFailureTime = 0;
    let state: "closed" | "open" | "half-open" = "closed";

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      const now = Date.now();

      if (state === "open") {
        if (now - lastFailureTime > timeout) {
          state = "half-open";
        } else {
          throw new ServiceUnavailableError("Circuit breaker is open");
        }
      }

      try {
        const result = await fn();
        if (state === "half-open") {
          state = "closed";
          failures = 0;
        }
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= threshold) {
          state = "open";
        }

        throw error;
      }
    };
  },
};

// Error response formatter for client-side
export function formatErrorResponse(error: ErrorResponse): string {
  const { error: errorData } = error;

  if (errorData.fieldErrors) {
    const fieldMessages = Object.entries(errorData.fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ");
    return `${errorData.message}. ${fieldMessages}`;
  }

  return errorData.message;
}

// Error boundary hook for React components
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    logError(error, { context });

    if (error instanceof ApiError) {
      // Handle API errors in UI
      console.error(`API Error [${error.code}]:`, error.message);
    } else if (error instanceof Error) {
      // Handle general errors
      console.error("Error:", error.message);
    } else {
      // Handle unknown errors
      console.error("Unknown error:", error);
    }
  };

  return { handleError };
}
