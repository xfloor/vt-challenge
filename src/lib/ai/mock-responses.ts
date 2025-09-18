/**
 * Mock AI responses for testing and development
 * These responses are used when API keys are not configured or in test environments
 */

export const MOCK_TITLES = [
  "The Epic Journey of Innovation",
  "A Tale of Digital Transformation",
  "The Future of Technology",
  "Revolutionary Breakthroughs",
  "The Story of Progress",
  "Innovation Unleashed",
  "The Digital Revolution",
  "Breaking Boundaries",
  "The Next Chapter",
  "Transforming Tomorrow",
];

export const MOCK_STORYBOARDS = [
  `Scene 1: A dramatic opening shot showing the beginning of an incredible journey, with cinematic lighting and wide-angle composition that captures the scale and importance of what's about to unfold.

Scene 2: The protagonist faces their first major challenge, with intense close-up shots showing determination and resolve as they navigate through obstacles and setbacks.

Scene 3: The climax of the story unfolds with high-energy action sequences, dramatic lighting, and dynamic camera movements that build tension and excitement.

Scene 4: A satisfying resolution with a sense of accomplishment and hope for the future, featuring warm lighting and a sense of closure that leaves viewers inspired.`,

  `Scene 1: An establishing shot of a futuristic landscape, showcasing advanced technology and innovation with clean, modern aesthetics and professional cinematography.

Scene 2: The main character discovers a groundbreaking solution, captured through intimate medium shots that emphasize the moment of realization and breakthrough.

Scene 3: The implementation phase shows the solution in action, with dynamic montage-style editing and energetic pacing that demonstrates progress and momentum.

Scene 4: The final scene reveals the transformative impact, with wide shots showing the positive changes and a sense of fulfillment and success.`,

  `Scene 1: A mysterious beginning with atmospheric lighting and intriguing composition that draws viewers into the narrative and sets the stage for discovery.

Scene 2: The exploration phase reveals new insights and understanding, with thoughtful camera work that emphasizes learning and growth.

Scene 3: The turning point arrives with dramatic tension and visual storytelling that showcases the pivotal moment of change and decision.

Scene 4: The conclusion brings everything together with a sense of completion and forward momentum, leaving audiences with a clear understanding of the journey.`,
];

export const MOCK_SCENE_PROMPTS = [
  [
    "Cinematic wide shot of a futuristic cityscape at dawn, professional photography, dramatic lighting, 16:9 aspect ratio",
    "Close-up of hands working on advanced technology, dramatic shadows, high contrast, professional cinematography, 16:9 aspect ratio",
    "Dynamic action sequence with movement and energy, dramatic lighting, professional film style, 16:9 aspect ratio",
    "Peaceful resolution scene with warm lighting, sense of accomplishment, professional photography, 16:9 aspect ratio",
  ],
  [
    "Establishing shot of a modern laboratory, clean and bright, professional photography, 16:9 aspect ratio",
    "Medium shot of scientist making breakthrough discovery, focused lighting, professional cinematography, 16:9 aspect ratio",
    "Montage sequence showing rapid progress, dynamic editing style, professional film quality, 16:9 aspect ratio",
    "Wide shot showing positive transformation, warm and hopeful lighting, professional photography, 16:9 aspect ratio",
  ],
  [
    "Atmospheric opening scene with mysterious lighting, professional cinematography, 16:9 aspect ratio",
    "Intimate scene of discovery and learning, thoughtful composition, professional photography, 16:9 aspect ratio",
    "Dramatic turning point with high tension, dynamic camera work, professional film style, 16:9 aspect ratio",
    "Satisfying conclusion with clear resolution, professional photography, 16:9 aspect ratio",
  ],
];

import { getPlaceholderImageByPrompt } from "./placeholder-images";

// Mock base64 image data - now using proper placeholder images
export const MOCK_IMAGE_DATA = [
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
];

/**
 * Get a random mock title
 */
export function getMockTitle(prompt: string): string {
  const index =
    Math.abs(prompt.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
    MOCK_TITLES.length;
  return MOCK_TITLES[index];
}

/**
 * Get a random mock storyboard
 */
export function getMockStoryboard(prompt: string, title: string): string {
  const index =
    Math.abs(
      (prompt + title).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    ) % MOCK_STORYBOARDS.length;
  return MOCK_STORYBOARDS[index];
}

/**
 * Get mock scene prompts
 */
export function getMockScenePrompts(
  storyboard: string,
  title: string
): string[] {
  const index =
    Math.abs(
      (storyboard + title).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    ) % MOCK_SCENE_PROMPTS.length;
  return [...MOCK_SCENE_PROMPTS[index]]; // Return a copy
}

/**
 * Get mock image data (base64)
 */
export function getMockImageData(prompt: string): string {
  // Use the new placeholder image system
  return getPlaceholderImageByPrompt(prompt);
}

/**
 * Get a mock image URL (deprecated - use getMockImageData instead)
 */
export function getMockImageUrl(prompt: string): string {
  const index =
    Math.abs(prompt.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
    MOCK_IMAGE_DATA.length;
  return MOCK_IMAGE_DATA[index];
}

/**
 * Check if we should use mock responses
 */
export function shouldUseMockResponses(): boolean {
  const hasOpenRouterKey =
    !!process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY.trim() !== "";
  const hasFalKey =
    !!process.env.FAL_API_KEY && process.env.FAL_API_KEY.trim() !== "";
  const isTestEnv = process.env.NODE_ENV === "test";

  // Use mocks if we're in test environment OR if we don't have both API keys
  // Both keys are needed for the full generation pipeline
  const shouldUseMocks = isTestEnv || !hasOpenRouterKey || !hasFalKey;

  console.log(`[MockResponses] Environment check:`, {
    isTestEnv,
    hasOpenRouterKey,
    hasFalKey,
    shouldUseMocks,
  });

  return shouldUseMocks;
}
