/**
 * Scene Types
 * Import from project.ts and add scene-specific utilities
 */

import {
  Position,
  Scene,
  SceneEdit,
  SceneStatus,
  validateScene,
} from "./project";

// Re-export for convenience
export { SceneStatus, validateScene };
export type { Position, Scene, SceneEdit };

/**
 * Scene-specific utility types and functions
 */

export type SceneUpdatePayload = {
  id: string;
  canvasPosition?: Position;
  prompt?: string;
};

export type SceneEditRequest = {
  prompt: string;
  sceneId: string;
  projectId: string;
};

/**
 * Default canvas positions for 4 scenes in a 2x2 grid layout, centered
 * These positions are relative to the center of the canvas
 * Each card is 300x169 (16:9 aspect ratio)
 * Grid spacing: 20px between cards
 * Total grid width: 300 + 20 + 300 = 620px
 * Total grid height: 169 + 20 + 169 = 358px
 * Container: 640x358px
 * Perfect centering: -160px to 160px (left), -89px to 89px (top)
 */
export const getDefaultScenePositions = (): Position[] => [
  { x: -160, y: -89, width: 300, height: 169 }, // Top-left
  { x: 160, y: -89, width: 300, height: 169 }, // Top-right
  { x: -160, y: 89, width: 300, height: 169 }, // Bottom-left
  { x: 160, y: 89, width: 300, height: 169 }, // Bottom-right
];

/**
 * Calculate aspect ratio for 16:9 scenes
 */
export const calculateSceneDimensions = (
  width: number
): { width: number; height: number } => {
  return {
    width,
    height: Math.round(width * (9 / 16)),
  };
};

/**
 * Check if a scene is in a loading state
 */
export const isSceneLoading = (status: SceneStatus): boolean => {
  return status === SceneStatus.GENERATING || status === SceneStatus.EDITING;
};

/**
 * Check if a scene is ready for interaction
 */
export const isSceneReady = (status: SceneStatus): boolean => {
  return status === SceneStatus.COMPLETED;
};

/**
 * Get the display name for a scene status
 */
export const getSceneStatusDisplay = (status: SceneStatus): string => {
  switch (status) {
    case SceneStatus.GENERATING:
      return "Generating...";
    case SceneStatus.EDITING:
      return "Editing...";
    case SceneStatus.COMPLETED:
      return "Ready";
    case SceneStatus.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
};
