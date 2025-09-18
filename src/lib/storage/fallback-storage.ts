/**
 * Fallback Storage Mechanisms
 * Handles localStorage quota issues and provides alternative storage methods
 */

import { VideoProject } from "@/types/project";
import {
  getLocalStorageSize,
  isLocalStorageFull,
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from "./browser-storage";

const FALLBACK_STORAGE_KEY = "videomaker_fallback_storage";
const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export interface FallbackStorageInfo {
  hasFallback: boolean;
  totalSize: number;
  chunkCount: number;
  lastUpdated: string;
}

/**
 * Check if we need to use fallback storage due to size constraints
 */
export function shouldUseFallbackStorage(project: VideoProject): boolean {
  const projectSize = new Blob([JSON.stringify(project)]).size;
  const currentStorageSize = getLocalStorageSize();
  const totalSize = projectSize + currentStorageSize;

  // Use fallback if project is large or localStorage is near capacity
  return (
    projectSize > 2 * 1024 * 1024 || // 2MB project
    currentStorageSize > 3 * 1024 * 1024 || // 3MB already used
    isLocalStorageFull()
  );
}

/**
 * Save project using fallback storage (chunked approach)
 */
export async function saveProjectFallback(
  project: VideoProject
): Promise<boolean> {
  try {
    console.log(
      `[FallbackStorage] Using fallback storage for project ${project.id}`
    );

    const projectJson = JSON.stringify(project);
    const projectSize = new Blob([projectJson]).size;

    console.log(
      `[FallbackStorage] Project size: ${(projectSize / 1024).toFixed(2)}KB`
    );

    // If project is small enough, try regular storage first
    if (projectSize < MAX_CHUNK_SIZE) {
      const regularSave = safeLocalStorageSetItem(
        `videomaker_project_${project.id}`,
        projectJson
      );
      if (regularSave) {
        console.log(`[FallbackStorage] Regular storage successful`);
        return true;
      }
    }

    // Use chunked storage
    const chunks = chunkString(projectJson, MAX_CHUNK_SIZE);
    console.log(`[FallbackStorage] Splitting into ${chunks.length} chunks`);

    // Save each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkKey = `videomaker_chunk_${project.id}_${i}`;
      const chunkSaved = safeLocalStorageSetItem(chunkKey, chunks[i]);
      if (!chunkSaved) {
        console.error(`[FallbackStorage] Failed to save chunk ${i}`);
        return false;
      }
    }

    // Save metadata
    const metadata = {
      projectId: project.id,
      chunkCount: chunks.length,
      totalSize: projectSize,
      lastUpdated: new Date().toISOString(),
    };

    const metadataKey = `videomaker_metadata_${project.id}`;
    const metadataSaved = safeLocalStorageSetItem(
      metadataKey,
      JSON.stringify(metadata)
    );
    if (!metadataSaved) {
      console.error(`[FallbackStorage] Failed to save metadata`);
      return false;
    }

    console.log(`[FallbackStorage] Project saved in ${chunks.length} chunks`);
    return true;
  } catch (error) {
    console.error(`[FallbackStorage] Error saving project:`, error);
    return false;
  }
}

/**
 * Load project from fallback storage
 */
export async function loadProjectFallback(
  projectId: string
): Promise<VideoProject | null> {
  try {
    console.log(
      `[FallbackStorage] Loading project ${projectId} from fallback storage`
    );

    // Try regular storage first
    const regularData = safeLocalStorageGetItem(
      `videomaker_project_${projectId}`
    );
    if (regularData) {
      console.log(`[FallbackStorage] Found in regular storage`);
      return JSON.parse(regularData);
    }

    // Try chunked storage
    const metadataKey = `videomaker_metadata_${projectId}`;
    const metadataData = safeLocalStorageGetItem(metadataKey);
    if (!metadataData) {
      console.log(
        `[FallbackStorage] No metadata found for project ${projectId}`
      );
      return null;
    }

    const metadata = JSON.parse(metadataData);
    console.log(`[FallbackStorage] Found metadata:`, metadata);

    // Load all chunks
    const chunks: string[] = [];
    for (let i = 0; i < metadata.chunkCount; i++) {
      const chunkKey = `videomaker_chunk_${projectId}_${i}`;
      const chunkData = safeLocalStorageGetItem(chunkKey);
      if (!chunkData) {
        console.error(
          `[FallbackStorage] Missing chunk ${i} for project ${projectId}`
        );
        return null;
      }
      chunks.push(chunkData);
    }

    // Reconstruct project
    const projectJson = chunks.join("");
    const project = JSON.parse(projectJson);

    console.log(
      `[FallbackStorage] Successfully loaded project from ${chunks.length} chunks`
    );
    return project;
  } catch (error) {
    console.error(`[FallbackStorage] Error loading project:`, error);
    return null;
  }
}

/**
 * Split a string into chunks of specified size
 */
function chunkString(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Clean up old fallback storage
 */
export function cleanupFallbackStorage(): void {
  try {
    console.log(`[FallbackStorage] Cleaning up old fallback storage`);

    // Get all localStorage keys
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    // Find and remove old chunked data
    const chunkKeys = keys.filter((key) => key.startsWith("videomaker_chunk_"));
    const metadataKeys = keys.filter((key) =>
      key.startsWith("videomaker_metadata_")
    );

    // Remove chunks older than 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    let removedCount = 0;
    for (const metadataKey of metadataKeys) {
      const metadataData = safeLocalStorageGetItem(metadataKey);
      if (metadataData) {
        try {
          const metadata = JSON.parse(metadataData);
          const lastUpdated = new Date(metadata.lastUpdated);

          if (lastUpdated < cutoffDate) {
            // Remove this project's chunks
            const projectId = metadata.projectId;
            const projectChunks = chunkKeys.filter((key) =>
              key.includes(projectId)
            );

            for (const chunkKey of projectChunks) {
              localStorage.removeItem(chunkKey);
              removedCount++;
            }

            localStorage.removeItem(metadataKey);
            removedCount++;
          }
        } catch (error) {
          console.warn(
            `[FallbackStorage] Error processing metadata ${metadataKey}:`,
            error
          );
        }
      }
    }

    console.log(
      `[FallbackStorage] Cleaned up ${removedCount} old storage items`
    );
  } catch (error) {
    console.error(`[FallbackStorage] Error during cleanup:`, error);
  }
}

/**
 * Get fallback storage information
 */
export function getFallbackStorageInfo(): FallbackStorageInfo {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    const chunkKeys = keys.filter((key) => key.startsWith("videomaker_chunk_"));
    const metadataKeys = keys.filter((key) =>
      key.startsWith("videomaker_metadata_")
    );

    let totalSize = 0;
    let chunkCount = 0;
    let lastUpdated = "";

    for (const metadataKey of metadataKeys) {
      const metadataData = safeLocalStorageGetItem(metadataKey);
      if (metadataData) {
        try {
          const metadata = JSON.parse(metadataData);
          totalSize += metadata.totalSize || 0;
          chunkCount += metadata.chunkCount || 0;
          if (metadata.lastUpdated > lastUpdated) {
            lastUpdated = metadata.lastUpdated;
          }
        } catch (error) {
          console.warn(
            `[FallbackStorage] Error parsing metadata ${metadataKey}:`,
            error
          );
        }
      }
    }

    return {
      hasFallback: chunkCount > 0,
      totalSize,
      chunkCount,
      lastUpdated,
    };
  } catch (error) {
    console.error(`[FallbackStorage] Error getting storage info:`, error);
    return {
      hasFallback: false,
      totalSize: 0,
      chunkCount: 0,
      lastUpdated: "",
    };
  }
}

