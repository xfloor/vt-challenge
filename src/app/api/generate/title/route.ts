import { generateTitle } from "@/lib/ai/openrouter";
import { APIErrorType, createErrorResponse, validatePrompt } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  prompt: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "prompt must be at least 1 character",
        validation.error.issues.map((i) => i.message).join(", ")
      );
      return NextResponse.json(error, { status: 400 });
    }

    const { prompt } = validation.data;

    // Additional validation
    const promptError = validatePrompt(prompt, 1, 10000);
    if (promptError) {
      const error = createErrorResponse(
        APIErrorType.VALIDATION_ERROR,
        "Prompt must be at least 1 character"
      );
      return NextResponse.json(error, { status: 400 });
    }

    // Generate title using OpenRouter
    try {
      const title = await generateTitle(prompt);

      // Validate generated title
      if (!title || title.length === 0) {
        throw new Error("Generated title is invalid");
      }

      return NextResponse.json({ title }, { status: 200 });
    } catch (aiError) {
      console.error("AI generation error:", aiError);

      const error = createErrorResponse(
        APIErrorType.AI_PROVIDER_ERROR,
        "Failed to generate title",
        aiError instanceof Error ? aiError.message : "Unknown AI provider error"
      );
      return NextResponse.json(error, { status: 500 });
    }
  } catch (error) {
    console.error("Title generation endpoint error:", error);

    const errorResponse = createErrorResponse(
      APIErrorType.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
