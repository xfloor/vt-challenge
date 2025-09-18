/**
 * Screen Reader Support
 * Utilities for enhanced screen reader accessibility
 */

/**
 * Screen reader announcement priorities
 */
export const ANNOUNCEMENT_PRIORITY = {
  POLITE: "polite",
  ASSERTIVE: "assertive",
  OFF: "off",
} as const;

export type AnnouncementPriority =
  (typeof ANNOUNCEMENT_PRIORITY)[keyof typeof ANNOUNCEMENT_PRIORITY];

/**
 * Screen reader utility functions
 */
export const screenReader = {
  /**
   * Announce a message to screen readers
   */
  announce: (
    message: string,
    priority: AnnouncementPriority = ANNOUNCEMENT_PRIORITY.POLITE,
    delay: number = 100
  ): void => {
    // Create a temporary live region for the announcement
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    liveRegion.style.position = "absolute";
    liveRegion.style.left = "-10000px";
    liveRegion.style.width = "1px";
    liveRegion.style.height = "1px";
    liveRegion.style.overflow = "hidden";

    document.body.appendChild(liveRegion);

    // Delay the announcement slightly to ensure screen readers pick it up
    setTimeout(() => {
      liveRegion.textContent = message;

      // Remove after a reasonable time
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
    }, delay);
  },

  /**
   * Create a persistent live region for status updates
   */
  createLiveRegion: (
    id: string,
    priority: AnnouncementPriority = ANNOUNCEMENT_PRIORITY.POLITE
  ): HTMLElement => {
    // Check if live region already exists
    let liveRegion = document.getElementById(id);

    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = id;
      liveRegion.setAttribute("aria-live", priority);
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only";
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";

      document.body.appendChild(liveRegion);
    }

    return liveRegion;
  },

  /**
   * Update a live region with new content
   */
  updateLiveRegion: (id: string, message: string): void => {
    const liveRegion = document.getElementById(id);
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  },

  /**
   * Remove a live region
   */
  removeLiveRegion: (id: string): void => {
    const liveRegion = document.getElementById(id);
    if (liveRegion && document.body.contains(liveRegion)) {
      document.body.removeChild(liveRegion);
    }
  },

  /**
   * Create descriptive text for complex UI elements
   */
  describeElement: (element: {
    type: string;
    name?: string;
    status?: string;
    position?: { current: number; total: number };
    properties?: Record<string, string | number>;
  }): string => {
    let description = element.type;

    if (element.name) {
      description += `, ${element.name}`;
    }

    if (element.status) {
      description += `, status: ${element.status}`;
    }

    if (element.position) {
      description += `, ${element.position.current} of ${element.position.total}`;
    }

    if (element.properties) {
      const props = Object.entries(element.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      description += `, ${props}`;
    }

    return description;
  },

  /**
   * Format progress information for screen readers
   */
  formatProgress: (current: number, total: number, label?: string): string => {
    const percentage = Math.round((current / total) * 100);
    let description = `${percentage}% complete`;

    if (label) {
      description = `${label}, ${description}`;
    }

    description += `, ${current} of ${total}`;

    return description;
  },

  /**
   * Format time duration for screen readers
   */
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    }

    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }

    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(
        `${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`
      );
    }

    return parts.join(", ");
  },

  /**
   * Format file size for screen readers
   */
  formatFileSize: (bytes: number): string => {
    const units = ["bytes", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const formattedSize = unitIndex === 0 ? size.toString() : size.toFixed(1);
    return `${formattedSize} ${units[unitIndex]}`;
  },
};

/**
 * Screen reader specific messages for the video app
 */
export const VIDEO_APP_MESSAGES = {
  // Generation process
  GENERATION_STARTED:
    "Video generation started. Please wait while we create your project.",
  GENERATION_TITLE: "Generating project title...",
  GENERATION_STORYBOARD: "Creating storyboard...",
  GENERATION_SCENES: "Generating scene images...",
  GENERATION_COMPLETE: "Video generation completed successfully.",
  GENERATION_FAILED: "Video generation failed. Please try again.",

  // Scene editing
  SCENE_EDIT_STARTED: "Scene editing started.",
  SCENE_EDIT_COMPLETE: "Scene updated successfully.",
  SCENE_EDIT_FAILED: "Failed to update scene. Please try again.",

  // Navigation
  NAVIGATED_TO_PROJECT: "Navigated to project details.",
  NAVIGATED_TO_EDITOR: "Switched to editor view.",
  NAVIGATED_TO_PREVIEW: "Switched to preview mode.",

  // Form interactions
  FORM_SUBMITTED: "Form submitted successfully.",
  FORM_ERROR: "Form contains errors. Please check your input.",
  FIELD_REQUIRED: "This field is required.",
  FIELD_INVALID: "This field contains invalid data.",

  // Loading states
  LOADING_PROJECTS: "Loading your projects...",
  LOADING_SCENES: "Loading scenes...",
  SAVING_CHANGES: "Saving your changes...",

  // Actions
  PROJECT_CREATED: "New project created successfully.",
  PROJECT_DELETED: "Project deleted successfully.",
  PROJECT_SAVED: "Project saved successfully.",

  // Errors
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
} as const;

/**
 * Context-aware announcements for the video app
 */
export const videoAppAnnouncements = {
  /**
   * Announce project status changes
   */
  projectStatus: (projectName: string, status: string): void => {
    const message = `Project ${projectName} status changed to ${status}`;
    screenReader.announce(message, ANNOUNCEMENT_PRIORITY.POLITE);
  },

  /**
   * Announce generation progress
   */
  generationProgress: (step: string, current: number, total: number): void => {
    const progress = screenReader.formatProgress(current, total, step);
    screenReader.announce(progress, ANNOUNCEMENT_PRIORITY.POLITE);
  },

  /**
   * Announce scene changes
   */
  sceneUpdate: (sceneNumber: number, action: string): void => {
    const message = `Scene ${sceneNumber} ${action}`;
    screenReader.announce(message, ANNOUNCEMENT_PRIORITY.POLITE);
  },

  /**
   * Announce navigation changes
   */
  navigation: (from: string, to: string): void => {
    const message = `Navigated from ${from} to ${to}`;
    screenReader.announce(message, ANNOUNCEMENT_PRIORITY.POLITE);
  },

  /**
   * Announce form validation results
   */
  formValidation: (isValid: boolean, errors?: string[]): void => {
    if (isValid) {
      screenReader.announce(
        "Form is valid and ready to submit",
        ANNOUNCEMENT_PRIORITY.POLITE
      );
    } else {
      const errorCount = errors?.length || 0;
      const message = `Form has ${errorCount} ${
        errorCount === 1 ? "error" : "errors"
      }`;
      screenReader.announce(message, ANNOUNCEMENT_PRIORITY.ASSERTIVE);
    }
  },

  /**
   * Announce successful actions
   */
  success: (action: string): void => {
    const message = `${action} completed successfully`;
    screenReader.announce(message, ANNOUNCEMENT_PRIORITY.POLITE);
  },

  /**
   * Announce errors
   */
  error: (action: string, error?: string): void => {
    let message = `${action} failed`;
    if (error) {
      message += `: ${error}`;
    }
    screenReader.announce(message, ANNOUNCEMENT_PRIORITY.ASSERTIVE);
  },
};

/**
 * Screen reader optimized component descriptions
 */
export const componentDescriptions = {
  /**
   * Describe a video project card
   */
  projectCard: (project: {
    title: string;
    status: string;
    createdAt: Date;
    sceneCount: number;
  }): string => {
    const createdDate = project.createdAt.toLocaleDateString();
    return screenReader.describeElement({
      type: "Video project",
      name: project.title,
      status: project.status,
      properties: {
        created: createdDate,
        scenes: project.sceneCount,
      },
    });
  },

  /**
   * Describe a scene in the editor
   */
  sceneImage: (scene: {
    position: number;
    total: number;
    status: string;
    hasImage: boolean;
  }): string => {
    return screenReader.describeElement({
      type: "Scene image",
      status: scene.status,
      position: { current: scene.position, total: scene.total },
      properties: {
        "has image": scene.hasImage ? "yes" : "no",
      },
    });
  },

  /**
   * Describe video player state
   */
  videoPlayer: (player: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
  }): string => {
    const timeDescription = `${screenReader.formatDuration(
      player.currentTime
    )} of ${screenReader.formatDuration(player.duration)}`;
    return screenReader.describeElement({
      type: "Video player",
      status: player.isPlaying ? "playing" : "paused",
      properties: {
        time: timeDescription,
        volume: `${Math.round(player.volume * 100)}%`,
      },
    });
  },
};

/**
 * Initialize screen reader support for the app
 */
export const initializeScreenReaderSupport = (): void => {
  // Create persistent live regions
  screenReader.createLiveRegion(
    "sr-announcements",
    ANNOUNCEMENT_PRIORITY.POLITE
  );
  screenReader.createLiveRegion("sr-alerts", ANNOUNCEMENT_PRIORITY.ASSERTIVE);

  // Announce app ready state
  setTimeout(() => {
    screenReader.announce(
      "AI Video Generation application loaded and ready",
      ANNOUNCEMENT_PRIORITY.POLITE
    );
  }, 1000);
};

/**
 * Cleanup screen reader support
 */
export const cleanupScreenReaderSupport = (): void => {
  screenReader.removeLiveRegion("sr-announcements");
  screenReader.removeLiveRegion("sr-alerts");
};

