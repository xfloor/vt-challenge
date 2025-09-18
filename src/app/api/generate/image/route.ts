import { generateImage } from "@/lib/ai/fal";
import {
  APIErrorType,
  createErrorResponse,
  validatePrompt,
  validateUUID,
} from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["fast", "quality"]).optional().default("fast"),
  sceneId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Invalid request body",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    const { prompt, model, sceneId } = validation.data;

    // Additional validation
    const promptError = validatePrompt(prompt, 1, 10000);
    if (promptError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Prompt must be at least 1 character"
      );
      return NextResponse.json(error, { status: 400 });
    }

    if (sceneId) {
      const sceneIdError = validateUUID(sceneId);
      if (sceneIdError) {
        const error = createErrorResponse(
          APIErrorType.VALIDATION_ERROR,
          sceneIdError
        );
        return NextResponse.json(error, { status: 400 });
      }
    }

    // Generate image using Fal AI
    try {
      const result = await generateImage(prompt, model);

      return NextResponse.json(
        {
          imageData: result.imageData,
          width: result.width,
          height: result.height,
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error("AI generation error:", aiError);

      // Check if it's a rate limit error
      if (aiError instanceof Error && aiError.message.includes("rate limit")) {
        const error = createErrorResponse(
          APIErrorType.RATE_LIMIT_EXCEEDED,
          "Too many image generation requests",
          "Please wait before making another request"
        );
        return NextResponse.json(error, { status: 429 });
      }

      const error = createErrorResponse(
        APIErrorType.AI_PROVIDER_ERROR,
        "Failed to generate image",
        aiError instanceof Error ? aiError.message : "Unknown AI provider error"
      );
      return NextResponse.json(error, { status: 500 });
    }
  } catch (error) {
    console.error("Image generation endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
