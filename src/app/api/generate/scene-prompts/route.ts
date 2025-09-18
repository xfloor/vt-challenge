import { generateScenePrompts } from "@/lib/ai/openrouter";
import { APIErrorType, createErrorResponse, validatePrompt } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  storyboard: z.string().min(1),
  title: z.string().min(1),
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

    const { storyboard, title } = validation.data;

    // Additional validation
    const storyboardError = validatePrompt(storyboard, 1, 10000);
    if (storyboardError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Storyboard must be at least 1 character"
      );
      return NextResponse.json(error, { status: 400 });
    }

    const titleError = validatePrompt(title, 1, 500);
    if (titleError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Title must be at least 1 character"
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Generate scene prompts using OpenRouter
    try {
      const prompts = await generateScenePrompts(storyboard, title);

      // Validate generated prompts
      if (!Array.isArray(prompts) || prompts.length !== 4) {
        throw new Error("Must generate exactly 4 scene prompts");
      }

      // Validate each prompt
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        if (
          !prompt ||
          typeof prompt !== "string" ||
          prompt.length === 0 ||
          prompt.length > 500
        ) {
          throw new Error(`Scene prompt ${i + 1} is invalid`);
        }
      }

      return NextResponse.json({ prompts }, { status: 200 });
    } catch (aiError) {
      console.error("AI generation error:", aiError);

      const error = createErrorResponse(
        APIErrorType.AI_PROVIDER_ERROR,
        "Failed to generate scene prompts",
        aiError instanceof Error ? aiError.message : "Unknown AI provider error"
      );
      return NextResponse.json(error, { status: 500 });
    }
  } catch (error) {
    console.error("Scene prompts generation endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
