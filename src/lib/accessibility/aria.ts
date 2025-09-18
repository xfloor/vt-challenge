/**
 * ARIA Labels and Roles
 * Provides consistent ARIA attributes for accessibility
 */

export const ARIA_LABELS = {
  // Form elements
  PROJECT_PROMPT_INPUT: "Enter your video idea or description",
  SUBMIT_BUTTON: "Create video project",
  LOADING_INDICATOR: "Creating your video project",

  // Navigation
  MAIN_NAVIGATION: "Main navigation",
  PROJECT_LIST: "Your video projects",
  SCENE_GALLERY: "Video scenes",

  // Project elements
  PROJECT_CARD: "Video project",
  PROJECT_TITLE: "Project title",
  PROJECT_STATUS: "Project status",
  PROJECT_ACTIONS: "Project actions",

  // Scene elements
  SCENE_IMAGE: "Scene image",
  SCENE_EDIT_BUTTON: "Edit scene",
  SCENE_POSITION: "Scene position in video",

  // Video player
  VIDEO_PLAYER: "Video preview player",
  PLAY_BUTTON: "Play video",
  PAUSE_BUTTON: "Pause video",
  SEEK_SLIDER: "Video timeline",

  // Modals and dialogs
  EDIT_SCENE_MODAL: "Edit scene dialog",
  CLOSE_MODAL: "Close dialog",
  SAVE_CHANGES: "Save changes",
  CANCEL_CHANGES: "Cancel changes",

  // Status messages
  SUCCESS_MESSAGE: "Success notification",
  ERROR_MESSAGE: "Error notification",
  WARNING_MESSAGE: "Warning notification",
  INFO_MESSAGE: "Information notification",
} as const;

export const ARIA_ROLES = {
  // Layout roles
  BANNER: "banner",
  MAIN: "main",
  COMPLEMENTARY: "complementary",
  CONTENTINFO: "contentinfo",
  NAVIGATION: "navigation",

  // Widget roles
  BUTTON: "button",
  LINK: "link",
  TEXTBOX: "textbox",
  LISTBOX: "listbox",
  OPTION: "option",
  TAB: "tab",
  TABPANEL: "tabpanel",
  TABLIST: "tablist",

  // Live region roles
  ALERT: "alert",
  STATUS: "status",
  LOG: "log",

  // Dialog roles
  DIALOG: "dialog",
  ALERTDIALOG: "alertdialog",

  // Grid and list roles
  GRID: "grid",
  GRIDCELL: "gridcell",
  LIST: "list",
  LISTITEM: "listitem",
} as const;

export const ARIA_STATES = {
  // Expanded/collapsed
  EXPANDED: "aria-expanded",
  COLLAPSED: "aria-expanded",

  // Selected
  SELECTED: "aria-selected",

  // Disabled
  DISABLED: "aria-disabled",

  // Hidden
  HIDDEN: "aria-hidden",

  // Live regions
  LIVE: "aria-live",
  ATOMIC: "aria-atomic",
  RELEVANT: "aria-relevant",

  // Descriptions
  DESCRIBEDBY: "aria-describedby",
  LABELLEDBY: "aria-labelledby",
  LABEL: "aria-label",

  // Form validation
  INVALID: "aria-invalid",
  REQUIRED: "aria-required",

  // Progress
  VALUENOW: "aria-valuenow",
  VALUEMIN: "aria-valuemin",
  VALUEMAX: "aria-valuemax",
  VALUETEXT: "aria-valuetext",
} as const;

/**
 * Helper functions for creating ARIA attributes
 */
export const createAriaProps = {
  /**
   * Create props for a labeled element
   */
  labeled: (label: string, describedBy?: string) => ({
    "aria-label": label,
    ...(describedBy && { "aria-describedby": describedBy }),
  }),

  /**
   * Create props for a button element
   */
  button: (label: string, pressed?: boolean, disabled?: boolean) => ({
    role: ARIA_ROLES.BUTTON,
    "aria-label": label,
    ...(pressed !== undefined && { "aria-pressed": pressed }),
    ...(disabled && { "aria-disabled": true }),
  }),

  /**
   * Create props for an expandable element
   */
  expandable: (label: string, expanded: boolean) => ({
    "aria-label": label,
    "aria-expanded": expanded,
  }),

  /**
   * Create props for a form input
   */
  input: (
    label: string,
    required?: boolean,
    invalid?: boolean,
    describedBy?: string
  ) => ({
    "aria-label": label,
    ...(required && { "aria-required": true }),
    ...(invalid && { "aria-invalid": true }),
    ...(describedBy && { "aria-describedby": describedBy }),
  }),

  /**
   * Create props for a live region
   */
  liveRegion: (politeness: "polite" | "assertive" = "polite") => ({
    "aria-live": politeness,
    "aria-atomic": true,
  }),

  /**
   * Create props for a progress indicator
   */
  progress: (
    value: number,
    min: number = 0,
    max: number = 100,
    text?: string
  ) => ({
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": min,
    "aria-valuemax": max,
    ...(text && { "aria-valuetext": text }),
  }),

  /**
   * Create props for a modal dialog
   */
  modal: (label: string, describedBy?: string) => ({
    role: ARIA_ROLES.DIALOG,
    "aria-modal": true,
    "aria-label": label,
    ...(describedBy && { "aria-describedby": describedBy }),
  }),

  /**
   * Create props for navigation elements
   */
  navigation: (label: string) => ({
    role: ARIA_ROLES.NAVIGATION,
    "aria-label": label,
  }),

  /**
   * Create props for lists
   */
  list: (label?: string) => ({
    role: ARIA_ROLES.LIST,
    ...(label && { "aria-label": label }),
  }),

  listItem: () => ({
    role: ARIA_ROLES.LISTITEM,
  }),
};

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export const generateAriaId = (prefix: string = "aria") => {
  return `${prefix}-${++idCounter}`;
};

/**
 * Screen reader only text (visually hidden but accessible)
 */
export const SCREEN_READER_ONLY_CLASS = "sr-only";

/**
 * Common ARIA patterns for the video generation app
 */
export const VIDEO_APP_ARIA = {
  // Homepage
  homepage: {
    main: createAriaProps.labeled("AI Video Generation Application"),
    promptInput: createAriaProps.input(ARIA_LABELS.PROJECT_PROMPT_INPUT, true),
    submitButton: createAriaProps.button(ARIA_LABELS.SUBMIT_BUTTON),
  },

  // Project management
  project: {
    list: createAriaProps.list(ARIA_LABELS.PROJECT_LIST),
    card: createAriaProps.labeled(ARIA_LABELS.PROJECT_CARD),
    title: createAriaProps.labeled(ARIA_LABELS.PROJECT_TITLE),
    status: createAriaProps.labeled(ARIA_LABELS.PROJECT_STATUS),
  },

  // Scene editing
  scene: {
    gallery: createAriaProps.list(ARIA_LABELS.SCENE_GALLERY),
    image: createAriaProps.labeled(ARIA_LABELS.SCENE_IMAGE),
    editButton: createAriaProps.button(ARIA_LABELS.SCENE_EDIT_BUTTON),
    editModal: createAriaProps.modal(ARIA_LABELS.EDIT_SCENE_MODAL),
  },

  // Video player
  player: {
    container: createAriaProps.labeled(ARIA_LABELS.VIDEO_PLAYER),
    playButton: createAriaProps.button(ARIA_LABELS.PLAY_BUTTON),
    pauseButton: createAriaProps.button(ARIA_LABELS.PAUSE_BUTTON),
  },

  // Notifications
  notification: {
    success: createAriaProps.liveRegion("polite"),
    error: createAriaProps.liveRegion("assertive"),
    warning: createAriaProps.liveRegion("polite"),
    info: createAriaProps.liveRegion("polite"),
  },
};

