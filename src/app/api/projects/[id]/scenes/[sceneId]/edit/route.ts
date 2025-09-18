import {
  loadProjectServer,
  saveProjectServer,
} from "@/lib/storage/server-storage";
import {
  APIErrorType,
  createErrorResponse,
  validatePrompt,
  validateUUID,
} from "@/types/api";
import { ProjectStatus, SceneStatus } from "@/types/project";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const EditSceneSchema = z.object({
  prompt: z.string().min(1).max(500),
});

/**
 * POST /api/projects/[id]/scenes/[sceneId]/edit
 * Edit scene image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { id: projectId, sceneId } = await params;
    const body = await request.json();

    // Validate IDs
    const projectIdError = validateUUID(projectId);
    if (projectIdError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        `Project ID: ${projectIdError}`
      );
      return NextResponse.json(error, { status: 400 });
    }

    const sceneIdError = validateUUID(sceneId);
    if (sceneIdError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        `Scene ID: ${sceneIdError}`
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Validate request body
    const validation = EditSceneSchema.safeParse(body);
    if (!validation.success) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Invalid request body",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    const { prompt } = validation.data;

    // Additional prompt validation
    const promptError = validatePrompt(prompt, 1, 500);
    if (promptError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        promptError
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Load project
    const project = await loadProjectServer(projectId);
    if (!project) {
      const error = createErrorResponse(
        APIErrorType.NOT_FOUND,
        "Project not found",
        `No project exists with ID: ${projectId}`
      );
      return NextResponse.json(error, { status: 404 });
    }

    // Find scene
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      const error = createErrorResponse(
        APIErrorType.NOT_FOUND,
        "Scene not found",
        `No scene exists with ID: ${sceneId} in project ${projectId}`
      );
      return NextResponse.json(error, { status: 404 });
    }

    // Create edit record
    const editId = crypto.randomUUID();
    const now = new Date();

    const edit = {
      id: editId,
      prompt,
      previousImageData: scene.imageData,
      newImageData: "", // Will be updated when image is generated
      timestamp: now,
    };

    // Update scene status and add edit to history
    scene.status = SceneStatus.EDITING;
    scene.editHistory.push(edit);

    // Keep only last 10 edits
    if (scene.editHistory.length > 10) {
      scene.editHistory = scene.editHistory.slice(-10);
    }

    // Update project timestamp
    project.updatedAt = now;
    project.status = ProjectStatus.EDITING;

    // Save project
    const saveSuccess = await saveProjectServer(project);
    if (!saveSuccess) {
      const error = createErrorResponse(
        APIErrorType.STORAGE_ERROR,
        "Failed to save scene edit"
      );
      return NextResponse.json(error, { status: 500 });
    }

    // Note: In a real implementation, you would trigger the image generation here
    // For now, we just return the edit status

    return NextResponse.json(
      {
        status: "editing",
        editId,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Edit scene endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "Failed to edit scene",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
