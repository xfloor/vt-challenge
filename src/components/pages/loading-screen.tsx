"use client";

import { Container, LayoutMain } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  GenerationProgress,
  GenerationStep,
  validateImageCompletion,
} from "@/lib/ai/pipeline";
import { generationQueue, QueueTask, TaskStatus } from "@/lib/ai/queue";
import { projectStorage } from "@/lib/storage/projects";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  FileVideo,
  Film,
  Image as ImageIcon,
  Sparkles,
  Type,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface LoadingScreenProps {
  projectId: string;
  onComplete?: (projectId: string) => void;
  onCancel?: () => void;
}

interface StepInfo {
  id: GenerationStep;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
}

const GENERATION_STEPS: StepInfo[] = [
  {
    id: GenerationStep.TITLE,
    label: "Generating Title",
    description: "Creating a compelling title for your video",
    icon: Type,
    estimatedTime: "10s",
  },
  {
    id: GenerationStep.STORYBOARD,
    label: "Creating Storyboard",
    description: "Structuring your video narrative",
    icon: Film,
    estimatedTime: "20s",
  },
  {
    id: GenerationStep.SCENE_PROMPTS,
    label: "Crafting Scene Prompts",
    description: "Generating detailed prompts for each scene",
    icon: Wand2,
    estimatedTime: "15s",
  },
  {
    id: GenerationStep.IMAGES,
    label: "Generating Images",
    description: "Creating stunning visuals for each scene",
    icon: ImageIcon,
    estimatedTime: "60s",
  },
  {
    id: GenerationStep.CACHING,
    label: "Finalizing",
    description: "Optimizing and preparing your video",
    icon: CheckCircle,
    estimatedTime: "5s",
  },
];

export function LoadingScreen({
  projectId,
  onComplete,
  onCancel,
}: LoadingScreenProps) {
  const [task, setTask] = useState<QueueTask | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState<GenerationStep>(
    GenerationStep.TITLE
  );
  const [hasShownErrorToast, setHasShownErrorToast] = useState(false);

  // Load project from appropriate storage (client or server)
  const loadProject = async (projectId: string) => {
    try {
      // Load from localStorage only
      const clientProject = await projectStorage.getProject(projectId);
      return clientProject;
    } catch (error) {
      console.error("Failed to load project:", error);
      return null;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Periodic check for project updates
  useEffect(() => {
    const checkProjectProgress = async () => {
      const project = await loadProject(projectId);
      if (project) {
        // Update current step based on project state (linear progression)
        if (project.title && !project.storyboard) {
          setCurrentStep(GenerationStep.STORYBOARD);
        } else if (
          project.storyboard &&
          project.scenes.some((s: { prompt?: string }) => !s.prompt)
        ) {
          setCurrentStep(GenerationStep.SCENE_PROMPTS);
        } else if (
          project.scenes.some(
            (s: { prompt?: string; imageData?: string; status?: string }) =>
              s.prompt && (!s.imageData || s.status !== "completed")
          )
        ) {
          setCurrentStep(GenerationStep.IMAGES);
        } else if (
          project.scenes.every(
            (s: { imageData?: string; status?: string }) =>
              s.imageData && s.status === "completed"
          )
        ) {
          setCurrentStep(GenerationStep.CACHING);
        }

        // Check if generation is complete with proper validation
        if (validateImageCompletion(project)) {
          // Mark task as completed if it's not already
          const tasks = generationQueue.getAllTasks();
          const projectTask = tasks.find((t) => t.projectId === projectId);
          if (projectTask && projectTask.status !== TaskStatus.COMPLETED) {
            projectTask.status = TaskStatus.COMPLETED;
            projectTask.completedAt = new Date();
            // The task update will be handled by the existing listener
          }
        }
      }
    };

    // Check immediately
    checkProjectProgress();

    // Then check every 2 seconds
    const interval = setInterval(checkProjectProgress, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    // Find the task for this project
    const tasks = generationQueue.getAllTasks();
    const projectTask = tasks.find((t) => t.projectId === projectId);

    if (projectTask) {
      setTask(projectTask);

      // Set up listener for task updates
      const handleTaskUpdate = async (updatedTask: QueueTask) => {
        if (updatedTask.id === projectTask.id) {
          setTask(updatedTask);

          // Update progress from task result if available
          if (updatedTask.result?.progress) {
            setProgress(updatedTask.result.progress);
            setCurrentStep(updatedTask.result.progress.step);
          }

          // Also check project status from storage to get real-time updates
          const project = await loadProject(projectId);
          if (project) {
            // Update current step based on project state (linear progression)
            if (project.title && !project.storyboard) {
              setCurrentStep(GenerationStep.STORYBOARD);
            } else if (
              project.storyboard &&
              project.scenes.some((s: { prompt?: string }) => !s.prompt)
            ) {
              setCurrentStep(GenerationStep.SCENE_PROMPTS);
            } else if (
              project.scenes.some(
                (s: { prompt?: string; imageData?: string; status?: string }) =>
                  s.prompt && (!s.imageData || s.status !== "completed")
              )
            ) {
              setCurrentStep(GenerationStep.IMAGES);
            } else if (
              project.scenes.every(
                (s: { imageData?: string; status?: string }) =>
                  s.imageData && s.status === "completed"
              )
            ) {
              setCurrentStep(GenerationStep.CACHING);
            }

            // Only mark as completed if all 4 images are ready
            if (validateImageCompletion(project)) {
              setCurrentStep(GenerationStep.CACHING);
            }
          }

          if (
            updatedTask.status === TaskStatus.PENDING &&
            task?.status !== TaskStatus.PENDING
          ) {
            toast.info("Generation queued", {
              description:
                "Your video generation request has been added to the queue.",
            });
          } else if (
            updatedTask.status === TaskStatus.RUNNING &&
            task?.status !== TaskStatus.RUNNING
          ) {
            toast.info("Generation started", {
              description: "AI is now creating your video content.",
            });
          } else if (updatedTask.status === TaskStatus.COMPLETED) {
            toast.success("Video generation completed!", {
              description: "Your AI video has been successfully created.",
            });
            setTimeout(() => {
              if (onComplete) onComplete(projectId);
            }, 1000);
          } else if (updatedTask.status === TaskStatus.FAILED) {
            const errorMessage =
              updatedTask.error?.message || "Generation failed";
            setError(errorMessage);

            // Show error toast only once
            if (!hasShownErrorToast) {
              toast.error("Generation failed", {
                description: errorMessage,
                action: {
                  label: "Retry",
                  onClick: () => handleRetry(),
                },
              });
              setHasShownErrorToast(true);
            }
          } else if (updatedTask.status === TaskStatus.CANCELLED) {
            toast.info("Generation cancelled", {
              description: "The video generation process has been cancelled.",
            });
          }
        }
      };

      generationQueue.onTaskUpdate(projectTask.id, handleTaskUpdate);

      return () => {
        generationQueue.removeListener(projectTask.id);
      };
    }

    return undefined;
  }, [projectId, onComplete, hasShownErrorToast]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStepStatus = (
    step: GenerationStep
  ): "pending" | "active" | "completed" | "error" => {
    if (error && currentStep === step) return "error";

    const stepIndex = GENERATION_STEPS.findIndex((s) => s.id === step);
    const currentIndex = GENERATION_STEPS.findIndex(
      (s) => s.id === currentStep
    );

    // If we have progress data, use it to determine status
    if (progress) {
      const progressStepIndex = GENERATION_STEPS.findIndex(
        (s) => s.id === progress.step
      );

      if (stepIndex < progressStepIndex) return "completed";
      if (stepIndex === progressStepIndex) return "active";
      return "pending";
    }

    // Fallback to currentStep logic
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const handleCancel = async () => {
    if (task) {
      await generationQueue.cancelTask(task.id);
    }
    if (onCancel) onCancel();
  };

  const handleRetry = useCallback(async () => {
    setError(null);
    setTimeElapsed(0);
    setHasShownErrorToast(false);
    setProgress(null);
    setCurrentStep(GenerationStep.TITLE);

    // Add new task to queue
    await generationQueue.addProjectGenerationTask(projectId);
  }, [projectId]);

  return (
    <LayoutMain className="min-h-screen flex items-center justify-center space-section">
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="card-glass">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 rounded-full gradient-primary flex items-center justify-center mb-4">
                  {error ? (
                    <AlertCircle className="h-8 w-8 text-white" />
                  ) : task?.status === TaskStatus.COMPLETED ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <Sparkles className="h-8 w-8 text-white" />
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gradient mb-2">
                  {error
                    ? "Generation Failed"
                    : task?.status === TaskStatus.COMPLETED
                    ? "Video Created!"
                    : "Creating Your AI Video"}
                </h1>

                <p className="text-muted-foreground">
                  {error
                    ? "Something went wrong during generation"
                    : task?.status === TaskStatus.COMPLETED
                    ? "Your video has been successfully generated"
                    : "Please wait while AI generates your video content"}
                </p>
              </div>

              {/* Progress Bar */}
              {!error && task?.status !== TaskStatus.COMPLETED && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {progress?.status || task?.status === TaskStatus.PENDING
                        ? "Queued..."
                        : "Initializing..."}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(timeElapsed)}
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full gradient-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress?.percentage || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    {progress?.percentage || 0}% complete
                    {progress?.currentSceneIndex !== undefined && (
                      <span className="ml-2">
                        (Scene {progress.currentSceneIndex + 1})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-4 mb-8">
                <AnimatePresence>
                  {GENERATION_STEPS.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const isActive = status === "active";

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border transition-all duration-normal",
                          status === "completed" &&
                            "bg-success/10 border-success/20",
                          status === "active" &&
                            "bg-primary/5 border-primary/20 animate-pulse",
                          status === "error" &&
                            "bg-destructive/10 border-destructive/20",
                          status === "pending" && "bg-muted/50 border-border"
                        )}
                      >
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            status === "completed" &&
                              "bg-success text-success-foreground",
                            status === "active" &&
                              "gradient-primary text-white",
                            status === "error" &&
                              "bg-destructive text-destructive-foreground",
                            status === "pending" &&
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          {status === "completed" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : status === "error" ? (
                            <X className="h-5 w-5" />
                          ) : isActive ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <step.icon className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{step.label}</h3>
                            <span className="text-xs text-muted-foreground">
                              {step.estimatedTime}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Queue Status */}
              {task && (
                <div className="mb-6 p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Queue Status:</span>
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        task.status === TaskStatus.RUNNING &&
                          "bg-primary text-primary-foreground",
                        task.status === TaskStatus.PENDING &&
                          "bg-warning text-warning-foreground",
                        task.status === TaskStatus.COMPLETED &&
                          "bg-success text-success-foreground",
                        task.status === TaskStatus.FAILED &&
                          "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                  {task.retryCount > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Retry attempt: {task.retryCount}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                {error ? (
                  <>
                    <Button onClick={handleRetry} className="btn-gradient">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="btn-ghost"
                    >
                      Cancel
                    </Button>
                  </>
                ) : task?.status === TaskStatus.COMPLETED ? (
                  <Button
                    onClick={() => onComplete?.(projectId)}
                    className="btn-gradient"
                  >
                    <FileVideo className="h-4 w-4 mr-2" />
                    View Video
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="btn-ghost"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Generation
                  </Button>
                )}
              </div>

              {/* Fun Facts */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Did you know?</h4>
                  <p className="text-sm text-muted-foreground text-balance">
                    Our AI processes over 1,000 style variations to create the
                    perfect visual representation of your ideas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </LayoutMain>
  );
}
