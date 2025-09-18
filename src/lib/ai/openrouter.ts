/**
 * OpenRouter AI Client
 * Handles text generation for titles, storyboards, and scene prompts
 */

import { getDefaultAIConfig } from "@/types/ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import {
  getMockScenePrompts,
  getMockStoryboard,
  getMockTitle,
  shouldUseMockResponses,
} from "./mock-responses";

const config = getDefaultAIConfig();

/**
 * Configure OpenRouter client
 */
const openRouterClient = createOpenRouter({
  apiKey: config.openRouter.apiKey,
});

/**
 * Generate a compelling title from user prompt
 */
export async function generateTitle(prompt: string): Promise<string> {
  console.log(`[OpenRouter] generateTitle called with prompt: ${prompt}`);
  console.log(
    `[OpenRouter] shouldUseMockResponses(): ${shouldUseMockResponses()}`
  );

  // Return mock response in test environment or when API key is not configured
  if (shouldUseMockResponses()) {
    console.log(`[OpenRouter] Using mock response for title generation`);
    return getMockTitle(prompt);
  }

  console.log(`[OpenRouter] Using real API for title generation`);
  console.log(`[OpenRouter] API Key configured: ${!!config.openRouter.apiKey}`);
  console.log(`[OpenRouter] Model: ${config.openRouter.model}`);

  try {
    const { text } = await generateText({
      model: openRouterClient.chat(config.openRouter.model),
      prompt: `Create a compelling, engaging title for a video based on this user request: "${prompt}"

Requirements:
- Keep it between 5-15 words
- Make it catchy and memorable
- Focus on the main theme or story
- No quotes or special characters
- Make it YouTube/social media friendly

Just return the title, nothing else.`,
      temperature: 0.7,
    });

    console.log(`[OpenRouter] Generated title: ${text.trim()}`);
    return text.trim();
  } catch (error) {
    console.error(`[OpenRouter] Error generating title:`, error);
    throw error;
  }
}

/**
 * Generate a detailed storyboard from prompt and title
 */
export async function generateStoryboard(
  prompt: string,
  title: string
): Promise<string> {
  // Return mock response in test environment or when API key is not configured
  if (shouldUseMockResponses()) {
    return getMockStoryboard(prompt, title);
  }

  const { text } = await generateText({
    model: openRouterClient.chat(config.openRouter.model),
    prompt: `Create a detailed storyboard for a video with the title "${title}" based on this request: "${prompt}"

Requirements:
- Write exactly 4 scenes that tell a complete story
- Each scene should be 2-3 sentences
- Include visual details for each scene
- Make it suitable for AI image generation
- Keep the flow logical and engaging
- Total length should be 200-500 words

Format as:
Scene 1: [description]
Scene 2: [description]
Scene 3: [description]  
Scene 4: [description]`,
    temperature: 0.8,
  });

  return text.trim();
}

/**
 * Generate 4 specific image prompts from storyboard
 */
export async function generateScenePrompts(
  storyboard: string,
  title: string
): Promise<string[]> {
  // Return mock response in test environment or when API key is not configured
  if (shouldUseMockResponses()) {
    return getMockScenePrompts(storyboard, title);
  }

  const { text } = await generateText({
    model: openRouterClient.chat(config.openRouter.model),
    prompt: `Convert this storyboard for "${title}" into exactly 4 detailed image generation prompts:

${storyboard}

Requirements for each prompt:
- Optimized for AI image generation (Stable Diffusion/FLUX)
- Include artistic style (cinematic, photorealistic, etc.)
- Specify 16:9 aspect ratio
- Include lighting and mood
- Be specific about visual elements
- 20-50 words per prompt
- Professional photography/film style

Return exactly 4 prompts, one per line, numbered 1-4:`,
    temperature: 0.7,
  });

  // Parse the response to extract the 4 prompts
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const prompts: string[] = [];
  for (const line of lines) {
    // Remove numbering and clean up
    const cleanPrompt = line.replace(/^\d+\.?\s*/, "").trim();
    if (cleanPrompt && prompts.length < 4) {
      // Ensure 16:9 aspect ratio is specified
      const finalPrompt = cleanPrompt.includes("16:9")
        ? cleanPrompt
        : `${cleanPrompt}, 16:9 aspect ratio`;
      prompts.push(finalPrompt);
    }
  }

  // Ensure we have exactly 4 prompts
  while (prompts.length < 4) {
    prompts.push(
      `Scene ${
        prompts.length + 1
      } from ${title}, cinematic style, professional photography, 16:9 aspect ratio`
    );
  }

  return prompts.slice(0, 4);
}
