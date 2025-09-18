import {
  APIErrorType,
  createErrorResponse,
  validatePagination,
  validatePrompt,
} from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schemas
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(1000),
});

// Note: ListProjectsSchema would be used for query param validation if needed

/**
 * GET /api/projects
 * List user's video projects
 * Note: This API now returns empty results as we use localStorage only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Validate pagination parameters
    const paginationError = validatePagination(limit, offset);
    if (paginationError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        paginationError
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Return empty results - frontend will use localStorage
    return NextResponse.json(
      {
        projects: [],
        total: 0,
        hasMore: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List projects endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to list projects",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create new video project
 * Note: This API now returns a 404 as we use localStorage only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateProjectSchema.safeParse(body);
    if (!validation.success) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Invalid request body",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    const { description } = validation.data;

    // Additional validation
    const promptError = validatePrompt(description, 1, 1000);
    if (promptError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        promptError
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Return 404 to force frontend to use localStorage
    const error = createErrorResponse(
      APIErrorType.NOT_FOUND,
      "Server storage not available - use localStorage"
    );
    return NextResponse.json(error, { status: 404 });
  } catch (error) {
    console.error("Create project endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to create project",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
