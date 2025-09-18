"use client";

import { CanvasWorkspace } from "@/components/canvas/canvas-workspace";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ViewToggle } from "@/components/ui/view-toggle";
import { VideoPlayer } from "@/components/video/video-player";
import { Scene, SceneStatus, VideoProject } from "@/types/project";
import {
  ArrowLeft,
  Download,
  Grid3X3,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditorViewProps {
  project: VideoProject;
  onProjectUpdate?: (project: VideoProject) => void;
  onBack?: () => void;
  className?: string;
}

type ViewMode = "canvas" | "video" | "split";

interface EditorState {
  viewMode: ViewMode;
  isGenerating: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  selectedSceneId: string | null;
  autoSave: boolean;
}

export function EditorView({
  project,
  onProjectUpdate,
  onBack,
  className = "",
}: EditorViewProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    viewMode: "canvas",
    isGenerating: false,
    isSaving: false,
    hasUnsavedChanges: false,
    selectedSceneId: null,
    autoSave: true,
  });

  const [localProject, setLocalProject] = useState<VideoProject>(project);

  // Auto-save functionality
  useEffect(() => {
    if (!editorState.autoSave || !editorState.hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [localProject, editorState.autoSave, editorState.hasUnsavedChanges]);

  const handleProjectUpdate = useCallback((updatedProject: VideoProject) => {
    setLocalProject(updatedProject);
    setEditorState((prev) => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  const handleSceneUpdate = useCallback(
    (sceneId: string, updates: Partial<Scene>) => {
      setLocalProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, ...updates } : scene
        ),
        updatedAt: new Date(),
      }));
      setEditorState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    },
    []
  );

  const handleSceneEdit = useCallback(
    async (sceneId: string, newPrompt: string) => {
      setEditorState((prev) => ({ ...prev, isGenerating: true }));

      try {
        // Update the scene prompt locally first
        handleSceneUpdate(sceneId, {
          prompt: newPrompt,
          status: SceneStatus.EDITING,
        });

        // Call the API to regenerate the image
        const response = await fetch(
          `/api/projects/${project.id}/scenes/${sceneId}/edit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: newPrompt }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update scene");
        }

        const data = await response.json();

        // Update the scene with the new image
        handleSceneUpdate(sceneId, {
          imageData: data.imageData,
          status: SceneStatus.COMPLETED,
          generatedAt: new Date(),
        });

        toast.success("Scene updated successfully");
      } catch (error) {
        console.error("Error updating scene:", error);
        toast.error("Failed to update scene");

        // Revert the scene status
        handleSceneUpdate(sceneId, {
          status: SceneStatus.FAILED,
        });
      } finally {
        setEditorState((prev) => ({ ...prev, isGenerating: false }));
      }
    },
    [project.id, handleSceneUpdate]
  );

  const handleSave = useCallback(async () => {
    if (!onProjectUpdate) return;

    setEditorState((prev) => ({ ...prev, isSaving: true }));

    try {
      // Update the project via localStorage
      const { projectStorage } = await import("@/lib/storage/projects");
      await projectStorage.saveProject(localProject);
      onProjectUpdate(localProject);
      setEditorState((prev) => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
      }));

      toast.success("Project saved successfully");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
      setEditorState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [localProject, project.id, onProjectUpdate]);

  const handleViewModeChange = useCallback((mode: string) => {
    setEditorState((prev) => ({ ...prev, viewMode: mode as ViewMode }));
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement video export
    toast.info("Video export not implemented yet");
  }, []);

  const handleShare = useCallback(() => {
    // TODO: Implement project sharing
    toast.info("Project sharing not implemented yet");
  }, []);

  const handleRegenerateAll = useCallback(async () => {
    setEditorState((prev) => ({ ...prev, isGenerating: true }));

    try {
      // Regenerate all scenes
      for (const scene of localProject.scenes) {
        await handleSceneEdit(scene.id, scene.prompt);
      }

      toast.success("All scenes regenerated successfully");
    } catch (error) {
      console.error("Error regenerating scenes:", error);
      toast.error("Failed to regenerate some scenes");
    } finally {
      setEditorState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [localProject.scenes, handleSceneEdit]);

  const getProjectStatus = () => {
    const completedScenes = localProject.scenes.filter(
      (s) => s.status === SceneStatus.COMPLETED
    ).length;
    const generatingScenes = localProject.scenes.filter(
      (s) => s.status === SceneStatus.GENERATING
    ).length;
    const failedScenes = localProject.scenes.filter(
      (s) => s.status === SceneStatus.FAILED
    ).length;

    if (generatingScenes > 0)
      return { status: "Generating", color: "text-yellow-600" };
    if (failedScenes > 0)
      return { status: "Some scenes failed", color: "text-red-600" };
    if (completedScenes === 4)
      return { status: "Ready", color: "text-green-600" };
    return { status: "Incomplete", color: "text-gray-600" };
  };

  const projectStatus = getProjectStatus();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div>
            <h1 className="text-xl font-semibold">{localProject.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={projectStatus.color}>
                {projectStatus.status}
              </span>
              <span>•</span>
              <span>
                {
                  localProject.scenes.filter(
                    (s) => s.status === SceneStatus.COMPLETED
                  ).length
                }
                /4 scenes
              </span>
              {editorState.hasUnsavedChanges && (
                <>
                  <span>•</span>
                  <span className="text-orange-600">Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle
            value={editorState.viewMode}
            onValueChange={handleViewModeChange}
            options={[
              { value: "canvas", label: "Canvas", icon: Grid3X3 },
              { value: "video", label: "Video", icon: Video },
              { value: "split", label: "Split", icon: Settings },
            ]}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateAll}
            disabled={editorState.isGenerating}
          >
            {editorState.isGenerating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Regenerate All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={editorState.isSaving || !editorState.hasUnsavedChanges}
          >
            {editorState.isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {editorState.viewMode === "canvas" && (
            <motion.div
              key="canvas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <CanvasWorkspace
                project={localProject}
                onSceneEdit={handleSceneEdit}
                className="h-full"
              />
            </motion.div>
          )}

          {editorState.viewMode === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center p-8"
            >
              <VideoPlayer
                project={localProject}
                width={800}
                height={450}
                className="max-w-4xl"
              />
            </motion.div>
          )}

          {editorState.viewMode === "split" && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full grid grid-cols-2 gap-4 p-4"
            >
              <div className="h-full">
                <CanvasWorkspace
                  project={localProject}
                  onSceneEdit={handleSceneEdit}
                  className="h-full"
                />
              </div>
              <div className="h-full flex items-center justify-center">
                <VideoPlayer
                  project={localProject}
                  width={400}
                  height={225}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-muted/50 text-sm text-muted-foreground border-t">
        <div className="flex items-center gap-4">
          <span>Project: {localProject.id.slice(0, 8)}...</span>
          <span>
            Created: {new Date(localProject.createdAt).toLocaleDateString()}
          </span>
          <span>
            Updated: {new Date(localProject.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editorState.isGenerating && (
            <div className="flex items-center gap-1 text-yellow-600">
              <LoadingSpinner size="sm" />
              <span>Generating...</span>
            </div>
          )}

          {editorState.autoSave && (
            <span className="text-green-600">Auto-save enabled</span>
          )}
        </div>
      </div>
    </div>
  );
}
