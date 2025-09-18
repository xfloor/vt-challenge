import { APIErrorType, createErrorResponse, validateUUID } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  scenes: z
    .array(
      z.object({
        id: z.string().uuid(),
        canvasPosition: z
          .object({
            x: z.number().min(0),
            y: z.number().min(0),
            width: z.number().min(1),
            height: z.number().min(1),
          })
          .optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/projects/[id]
 * Get project details
 * Note: This API now returns 404 as we use localStorage only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idError = validateUUID(projectId);
    if (idError) {
      const error = createErrorResponse(APIErrorType.VALIDATION_ERROR, idError);
      return NextResponse.json(error, { status: 400 });
    }

    // Return 404 to force frontend to use localStorage
    const error = createErrorResponse(
      APIErrorType.NOT_FOUND,
      "Project not found",
      `Server storage not available - use localStorage for project: ${projectId}`
    );
    return NextResponse.json(error, { status: 404 });
  } catch (error) {
    console.error("Get project endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to get project",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Update project
 * Note: This API now returns 404 as we use localStorage only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate project ID
    const idError = validateUUID(projectId);
    if (idError) {
      const error = createErrorResponse(APIErrorType.VALIDATION_ERROR, idError);
      return NextResponse.json(error, { status: 400 });
    }

    // Validate request body
    const validation = UpdateProjectSchema.safeParse(body);
    if (!validation.success) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Invalid request body",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Return 404 to force frontend to use localStorage
    const error = createErrorResponse(
      APIErrorType.NOT_FOUND,
      "Project not found",
      `Server storage not available - use localStorage for project: ${projectId}`
    );
    return NextResponse.json(error, { status: 404 });
  } catch (error) {
    console.error("Update project endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to update project",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project
 * Note: This API now returns 404 as we use localStorage only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Validate project ID
    const idError = validateUUID(projectId);
    if (idError) {
      const error = createErrorResponse(APIErrorType.VALIDATION_ERROR, idError);
      return NextResponse.json(error, { status: 400 });
    }

    // Return 404 to force frontend to use localStorage
    const error = createErrorResponse(
      APIErrorType.NOT_FOUND,
      "Project not found",
      `Server storage not available - use localStorage for project: ${projectId}`
    );
    return NextResponse.json(error, { status: 404 });
  } catch (error) {
    console.error("Delete project endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to delete project",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
