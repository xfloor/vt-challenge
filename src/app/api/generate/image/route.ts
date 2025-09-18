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
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[ImageAPI:${requestId}] Starting image generation request`);

  try {
    const body = await request.json();
    console.log(`[ImageAPI:${requestId}] Request body received:`, {
      promptLength: body.prompt?.length || 0,
      model: body.model,
      sceneId: body.sceneId,
      hasPrompt: !!body.prompt,
    });

    // Validate request body
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      console.error(
        `[ImageAPI:${requestId}] Validation failed:`,
        validation.error.issues
      );
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Invalid request body",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    const { prompt, model, sceneId } = validation.data;
    console.log(`[ImageAPI:${requestId}] Validated request:`, {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      model,
      sceneId,
    });

    // Additional validation
    const promptError = validatePrompt(prompt, 1, 10000);
    if (promptError) {
      console.error(
        `[ImageAPI:${requestId}] Prompt validation failed:`,
        promptError
      );
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Prompt must be at least 1 character"
      );
      return NextResponse.json(error, { status: 400 });
    }

    if (sceneId) {
      const sceneIdError = validateUUID(sceneId);
      if (sceneIdError) {
        console.error(
          `[ImageAPI:${requestId}] Scene ID validation failed:`,
          sceneIdError
        );
        const error = createErrorResponse(
          APIErrorType.VALIDATION_ERROR,
          sceneIdError
        );
        return NextResponse.json(error, { status: 400 });
      }
    }

    // Generate image using Fal AI
    try {
      console.log(
        `[ImageAPI:${requestId}] Starting image generation with model: ${model}`
      );
      const startTime = Date.now();

      const result = await generateImage(prompt, model);
      const generationTime = Date.now() - startTime;

      console.log(
        `[ImageAPI:${requestId}] Image generation completed in ${generationTime}ms:`,
        {
          hasImageData: !!result.imageData,
          imageDataLength: result.imageData?.length || 0,
          width: result.width,
          height: result.height,
          imageDataPreview:
            result.imageData?.substring(0, 50) + "..." || "null",
        }
      );

      // Validate the result before returning
      if (!result.imageData || result.imageData.length === 0) {
        console.error(
          `[ImageAPI:${requestId}] Generated image data is empty or null`
        );
        const error = createErrorResponse(
          APIErrorType.AI_PROVIDER_ERROR,
          "Generated image data is empty",
          "The AI provider returned an empty image"
        );
        return NextResponse.json(error, { status: 500 });
      }

      if (
        !result.width ||
        !result.height ||
        result.width <= 0 ||
        result.height <= 0
      ) {
        console.error(`[ImageAPI:${requestId}] Invalid image dimensions:`, {
          width: result.width,
          height: result.height,
        });
        const error = createErrorResponse(
          APIErrorType.AI_PROVIDER_ERROR,
          "Invalid image dimensions",
          "The AI provider returned invalid image dimensions"
        );
        return NextResponse.json(error, { status: 500 });
      }

      console.log(`[ImageAPI:${requestId}] Returning successful response`);
      return NextResponse.json(
        {
          imageData: result.imageData,
          width: result.width,
          height: result.height,
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error(`[ImageAPI:${requestId}] AI generation error:`, {
        error: aiError,
        message: aiError instanceof Error ? aiError.message : "Unknown error",
        stack: aiError instanceof Error ? aiError.stack : undefined,
        name: aiError instanceof Error ? aiError.name : undefined,
      });

      // Check if it's a rate limit error
      if (aiError instanceof Error && aiError.message.includes("rate limit")) {
        console.error(`[ImageAPI:${requestId}] Rate limit exceeded`);
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
    console.error(`[ImageAPI:${requestId}] Endpoint error:`, {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
