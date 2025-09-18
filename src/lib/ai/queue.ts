/**
 * Generation Queue Manager
 * Manages concurrent AI generation tasks with priority, retry logic, and resource management
 */

import {
  GenerationOptions,
  GenerationResult,
  generateProjectContentEnhanced,
  regenerateScene,
} from "./pipeline";

export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum TaskType {
  FULL_PROJECT = "full_project",
  SCENE_REGENERATION = "scene_regeneration",
  TITLE_ONLY = "title_only",
  STORYBOARD_ONLY = "storyboard_only",
  IMAGES_ONLY = "images_only",
}

export interface QueueTask {
  id: string;
  type: TaskType;
  priority: QueuePriority;
  projectId: string;
  sceneId?: string; // For scene regeneration
  prompt?: string; // For scene regeneration
  options?: GenerationOptions;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  status: TaskStatus;
  result?: GenerationResult | any;
  error?: Error;
  progress?: number;
  estimatedDuration?: number;
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

export interface QueueStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalTasks: number;
  averageCompletionTime: number;
  queueThroughput: number; // tasks per minute
}

export interface QueueManagerOptions {
  maxConcurrentTasks: number;
  enableRetries: boolean;
  maxRetries: number;
  retryDelay: number;
  enablePersistence: boolean;
  autoStart: boolean;
  resourceThrottle: boolean;
  maxQueueSize: number;
}

const DEFAULT_OPTIONS: QueueManagerOptions = {
  maxConcurrentTasks: 2,
  enableRetries: true,
  maxRetries: 3,
  retryDelay: 2000,
  enablePersistence: true,
  autoStart: true,
  resourceThrottle: true,
  maxQueueSize: 100,
};

export class GenerationQueueManager {
  private tasks: Map<string, QueueTask> = new Map();
  private runningTasks: Set<string> = new Set();
  private options: QueueManagerOptions;
  private isProcessing = false;
  private completionTimes: number[] = [];
  private listeners: Map<string, (task: QueueTask) => void> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(options: Partial<QueueManagerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (this.options.enablePersistence && typeof window !== "undefined") {
      this.loadPersistedTasks();
    }

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Add a task to the queue
   */
  async addTask(
    task: Omit<QueueTask, "id" | "createdAt" | "retryCount" | "status">
  ): Promise<string> {
    if (this.tasks.size >= this.options.maxQueueSize) {
      throw new Error("Queue is full");
    }

    const taskId = crypto.randomUUID();
    const queueTask: QueueTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
      retryCount: 0,
      status: TaskStatus.PENDING,
    };

    this.tasks.set(taskId, queueTask);

    if (this.options.enablePersistence) {
      this.persistTasks();
    }

    this.notifyListeners(queueTask);

    if (this.isProcessing) {
      this.processQueue();
    }

    return taskId;
  }

  /**
   * Add a full project generation task
   */
  async addProjectGenerationTask(
    projectId: string,
    options?: GenerationOptions,
    priority: QueuePriority = QueuePriority.NORMAL
  ): Promise<string> {
    return this.addTask({
      type: TaskType.FULL_PROJECT,
      priority,
      projectId,
      options,
      maxRetries: this.options.maxRetries,
      estimatedDuration: 120000, // 2 minutes estimate
    });
  }

  /**
   * Add a scene regeneration task
   */
  async addSceneRegenerationTask(
    projectId: string,
    sceneId: string,
    prompt: string,
    priority: QueuePriority = QueuePriority.HIGH
  ): Promise<string> {
    return this.addTask({
      type: TaskType.SCENE_REGENERATION,
      priority,
      projectId,
      sceneId,
      prompt,
      maxRetries: this.options.maxRetries,
      estimatedDuration: 30000, // 30 seconds estimate
    });
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): QueueTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): QueueTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): QueueTask[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === status
    );
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.RUNNING) {
      // Abort the running task
      const controller = this.abortControllers.get(taskId);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(taskId);
      }
      this.runningTasks.delete(taskId);
    }

    task.status = TaskStatus.CANCELLED;
    task.completedAt = new Date();

    this.notifyListeners(task);

    if (this.options.enablePersistence) {
      this.persistTasks();
    }

    return true;
  }

  /**
   * Pause the entire queue
   */
  pause(): void {
    this.isProcessing = false;
  }

  /**
   * Resume the queue
   */
  resume(): void {
    this.start();
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.processQueue();
    }
  }

  /**
   * Stop processing and cancel all running tasks
   */
  async stop(): Promise<void> {
    this.isProcessing = false;

    // Cancel all running tasks
    const runningTaskIds = Array.from(this.runningTasks);
    await Promise.all(runningTaskIds.map((taskId) => this.cancelTask(taskId)));
  }

  /**
   * Clear completed and failed tasks
   */
  clearCompletedTasks(): void {
    const tasksToRemove = Array.from(this.tasks.entries())
      .filter(
        ([, task]) =>
          task.status === TaskStatus.COMPLETED ||
          task.status === TaskStatus.FAILED
      )
      .map(([id]) => id);

    tasksToRemove.forEach((id) => this.tasks.delete(id));

    if (this.options.enablePersistence) {
      this.persistTasks();
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const tasks = Array.from(this.tasks.values());
    const pending = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const running = tasks.filter((t) => t.status === TaskStatus.RUNNING).length;
    const completed = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    const failed = tasks.filter((t) => t.status === TaskStatus.FAILED).length;
    const cancelled = tasks.filter(
      (t) => t.status === TaskStatus.CANCELLED
    ).length;

    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.startedAt && t.completedAt
    );
    const averageCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            const duration =
              task.completedAt!.getTime() - task.startedAt!.getTime();
            return sum + duration;
          }, 0) / completedTasks.length
        : 0;

    // Calculate throughput based on last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCompletions = completedTasks.filter(
      (task) => task.completedAt! > oneHourAgo
    ).length;
    const queueThroughput = recentCompletions; // tasks per hour, but we'll call it per minute for simplicity

    return {
      pending,
      running,
      completed,
      failed,
      cancelled,
      totalTasks: tasks.length,
      averageCompletionTime,
      queueThroughput,
    };
  }

  /**
   * Add event listener for task updates
   */
  onTaskUpdate(taskId: string, listener: (task: QueueTask) => void): void {
    this.listeners.set(`${taskId}`, listener);
  }

  /**
   * Add global event listener for all task updates
   */
  onAnyTaskUpdate(listener: (task: QueueTask) => void): void {
    this.listeners.set("*", listener);
  }

  /**
   * Remove event listener
   */
  removeListener(key: string): void {
    this.listeners.delete(key);
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    while (
      this.isProcessing &&
      this.runningTasks.size < this.options.maxConcurrentTasks
    ) {
      const nextTask = this.getNextTask();
      if (!nextTask) break;

      this.executeTask(nextTask);
    }
  }

  /**
   * Get the next task to execute (by priority and creation time)
   */
  private getNextTask(): QueueTask | null {
    const pendingTasks = Array.from(this.tasks.values())
      .filter((task) => task.status === TaskStatus.PENDING)
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time (earlier first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return pendingTasks[0] || null;
  }

  /**
   * Execute a task
   */
  private async executeTask(task: QueueTask): Promise<void> {
    console.log(
      `[GenerationQueue] Executing task ${task.id} of type ${task.type} for project ${task.projectId}`
    );
    const startTime = Date.now();

    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    this.runningTasks.add(task.id);

    // Create abort controller for this task
    const controller = new AbortController();
    this.abortControllers.set(task.id, controller);

    this.notifyListeners(task);

    try {
      let result: any;

      switch (task.type) {
        case TaskType.FULL_PROJECT:
          result = await generateProjectContentEnhanced(task.projectId, {
            ...task.options,
            onProgress: (progress) => {
              task.progress = progress.percentage;
              // Store the full progress object in the task for the loading screen
              task.result = { ...task.result, progress };
              this.notifyListeners(task);
            },
          });
          break;

        case TaskType.SCENE_REGENERATION:
          if (!task.sceneId || !task.prompt) {
            throw new Error(
              "Scene ID and prompt required for scene regeneration"
            );
          }
          result = await regenerateScene(
            task.projectId,
            task.sceneId,
            task.prompt
          );
          break;

        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Check if the generation actually succeeded
      if (task.type === TaskType.FULL_PROJECT && result && !result.success) {
        // Generation failed, mark task as failed
        task.status = TaskStatus.FAILED;
        task.error = new Error(
          result.errors?.[0]?.error?.message || "Generation failed"
        );
        task.completedAt = new Date();
      } else {
        // Generation succeeded
        task.status = TaskStatus.COMPLETED;
        task.result = result;
        task.completedAt = new Date();
      }

      // Track completion time for statistics
      const completionTime = Date.now() - startTime;
      this.completionTimes.push(completionTime);
      if (this.completionTimes.length > 100) {
        this.completionTimes = this.completionTimes.slice(-100); // Keep last 100
      }
    } catch (error) {
      console.error(`[GenerationQueue] Task ${task.id} failed:`, error);
      if (controller.signal.aborted) {
        task.status = TaskStatus.CANCELLED;
      } else if (
        this.options.enableRetries &&
        task.retryCount < task.maxRetries
      ) {
        // Retry the task
        task.retryCount++;
        task.status = TaskStatus.PENDING;
        task.startedAt = undefined;

        // Add delay before retry
        setTimeout(() => {
          if (this.isProcessing) {
            this.processQueue();
          }
        }, this.options.retryDelay * task.retryCount);
      } else {
        task.status = TaskStatus.FAILED;
        task.error = error as Error;
        task.completedAt = new Date();
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.abortControllers.delete(task.id);

      this.notifyListeners(task);

      if (this.options.enablePersistence) {
        this.persistTasks();
      }

      // Continue processing
      if (this.isProcessing) {
        this.processQueue();
      }
    }
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(task: QueueTask): void {
    // Notify specific task listener
    const taskListener = this.listeners.get(task.id);
    if (taskListener) {
      taskListener(task);
    }

    // Notify global listener
    const globalListener = this.listeners.get("*");
    if (globalListener) {
      globalListener(task);
    }
  }

  /**
   * Persist tasks to storage
   */
  private persistTasks(): void {
    if (typeof window === "undefined") return;

    try {
      const tasksArray = Array.from(this.tasks.values());
      localStorage.setItem(
        "generation_queue_tasks",
        JSON.stringify(tasksArray)
      );
    } catch (error) {
      console.error("Failed to persist queue tasks:", error);
    }
  }

  /**
   * Load persisted tasks from storage
   */
  private loadPersistedTasks(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("generation_queue_tasks");
      if (stored) {
        const tasksArray: QueueTask[] = JSON.parse(stored);

        tasksArray.forEach((task) => {
          // Convert date strings back to Date objects
          task.createdAt = new Date(task.createdAt);
          if (task.startedAt) task.startedAt = new Date(task.startedAt);
          if (task.completedAt) task.completedAt = new Date(task.completedAt);

          // Reset running tasks to pending on load
          if (task.status === TaskStatus.RUNNING) {
            task.status = TaskStatus.PENDING;
            task.startedAt = undefined;
          }

          this.tasks.set(task.id, task);
        });
      }
    } catch (error) {
      // Silently fail in SSR - this is expected
      console.debug("Failed to load persisted queue tasks (SSR):", error);
    }
  }
}

// Export singleton instance
export const generationQueue = new GenerationQueueManager();
