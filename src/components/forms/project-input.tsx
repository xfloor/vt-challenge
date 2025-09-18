"use client";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToastActions } from "@/components/ui/toast";
import { generationQueue, QueuePriority } from "@/lib/ai/queue";
import { projectStorage } from "@/lib/storage/projects";
import { cn } from "@/lib/utils";
import { ProjectStatus, SceneStatus, VideoProject } from "@/types/project";
import { getDefaultScenePositions } from "@/types/scene";
import {
  AlertCircle,
  Clock,
  FileVideo,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";

interface ProjectInputFormProps {
  onProjectCreated?: (projectId: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  title: string;
  prompt: string;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Product Demo",
    prompt:
      "A sleek smartphone product demonstration showcasing key features and elegant design",
  },
  {
    title: "Travel Adventure",
    prompt:
      "An exciting travel journey through tropical islands with crystal clear waters and white sand beaches",
  },
  {
    title: "Cooking Tutorial",
    prompt:
      "A step-by-step cooking tutorial for making authentic Italian pasta with fresh ingredients",
  },
  {
    title: "Tech Startup",
    prompt:
      "A modern tech startup presentation showcasing innovative AI solutions and team collaboration",
  },
  {
    title: "Nature Documentary",
    prompt:
      "A serene nature documentary about forest wildlife and seasonal changes in autumn",
  },
  {
    title: "Fitness Workout",
    prompt:
      "An energetic home fitness workout routine focusing on strength training and cardio exercises",
  },
];

export function ProjectInputForm({
  onProjectCreated,
  onCancel,
  className,
}: ProjectInputFormProps) {
  const [formData, setFormData] = useState<FormData>({ title: "", prompt: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const toast = useToastActions();

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.prompt.trim()) {
      newErrors.prompt = "Please describe your video idea";
    } else if (formData.prompt.trim().length < 10) {
      newErrors.prompt =
        "Please provide a more detailed description (at least 10 characters)";
    } else if (formData.prompt.trim().length > 1000) {
      newErrors.prompt = "Description is too long (maximum 1000 characters)";
    }

    if (formData.title.trim() && formData.title.trim().length > 100) {
      newErrors.title = "Title is too long (maximum 100 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      // Create project with initial data
      const projectId = crypto.randomUUID();
      const defaultPositions = getDefaultScenePositions();

      const project: VideoProject = {
        id: projectId,
        title: formData.title.trim() || "Untitled Project",
        originalPrompt: formData.prompt.trim(),
        storyboard: "",
        scenes: defaultPositions.map((position, index) => ({
          id: crypto.randomUUID(),
          projectId,
          index,
          prompt: "",
          imageData: "",
          canvasPosition: position,
          status: SceneStatus.GENERATING,
          generatedAt: new Date(),
          editHistory: [],
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: ProjectStatus.GENERATING,
      };

      // Save initial project
      const saved = await projectStorage.saveProject(project);
      if (!saved) {
        throw new Error("Failed to save project");
      }

      // Add to generation queue
      await generationQueue.addProjectGenerationTask(
        projectId,
        { useClientStorage: true },
        QueuePriority.HIGH
      );

      // Notify success
      if (onProjectCreated) {
        onProjectCreated(projectId);
      }

      toast.success("Project Created!", "Your video is being generated...");
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(
        "Creation Failed",
        "Unable to create project. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleExampleSelect = (suggestion: string) => {
    const example = EXAMPLE_PROMPTS.find((ex) => ex.prompt === suggestion);
    if (example) {
      setFormData({
        title: example.title,
        prompt: example.prompt,
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.prompt.trim()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl card-glass", className)}>
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-gradient">Create AI Video</CardTitle>
              <CardDescription>
                Describe your video idea and let AI bring it to life
              </CardDescription>
            </div>
          </div>

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 btn-ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors duration-normal",
              currentStep >= 1 ? "bg-gradient-primary" : "bg-muted"
            )}
          />
          <div
            className={cn(
              "h-0.5 w-8 transition-colors duration-normal",
              currentStep >= 2 ? "bg-gradient-primary" : "bg-muted"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors duration-normal",
              currentStep >= 2 ? "bg-gradient-primary" : "bg-muted"
            )}
          />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Video Description with AI SDK Elements */}
              <div className="space-y-4">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe your video idea *
                </label>

                <div className="relative">
                  <Textarea
                    id="prompt"
                    name="prompt"
                    placeholder="Tell us what your video should be about. Be as detailed as you like - the more specific, the better the results!"
                    value={formData.prompt}
                    onChange={(e) =>
                      handleInputChange("prompt", e.target.value)
                    }
                    className={cn(
                      "min-h-[100px] resize-none",
                      errors.prompt &&
                        "border-destructive focus:border-destructive"
                    )}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">
                      {formData.prompt.length}/1000 characters
                    </div>
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.prompt.trim()}
                      className="btn-gradient"
                    >
                      Continue
                    </Button>
                  </div>
                </div>

                {errors.prompt && (
                  <div className="flex items-center gap-2 text-destructive text-sm animate-in">
                    <AlertCircle className="h-4 w-4" />
                    {errors.prompt}
                  </div>
                )}
              </div>

              {/* AI SDK Suggestions */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Need inspiration? Try these examples:
                </label>
                <Suggestions className="grid gap-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((example, index) => (
                    <Suggestion
                      key={index}
                      suggestion={example.prompt}
                      onClick={handleExampleSelect}
                      className="card-interactive p-3 text-left"
                    >
                      <div className="font-medium text-sm">{example.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {example.prompt}
                      </div>
                    </Suggestion>
                  ))}
                </Suggestions>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!formData.prompt.trim()}
                  className="min-w-[120px] btn-gradient"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Optional Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Project title (optional)
                </label>
                <Input
                  id="title"
                  placeholder="Leave blank to auto-generate a title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={
                    errors.title ? "border-red-500 focus:border-red-500" : ""
                  }
                />
                {errors.title && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg glass border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <FileVideo className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gradient">
                      {formData.title || "Auto-generated title"}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3 text-balance">
                      {formData.prompt}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~2 minutes to generate
                      </div>
                      <div className="flex items-center gap-1">
                        <Wand2 className="h-3 w-3" />4 AI-generated scenes
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="min-w-[100px] btn-ghost"
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="min-w-[140px] btn-gradient"
                >
                  {isCreating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Video
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
