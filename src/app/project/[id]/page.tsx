"use client";

import { SceneImage } from "@/components/canvas/scene-image";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ViewToggle } from "@/components/ui/view-toggle";
import { VideoPlayer } from "@/components/video/video-player";
import { ProjectProvider } from "@/context/project-context";
import { SessionProvider } from "@/context/session-context";
import { VideoProject } from "@/types/project";
import { ArrowLeft, Grid3X3, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ViewMode = "canvas" | "video";

interface CanvasState {
  zoom: number;
  selectedSceneId: string | null;
  showGrid: boolean;
}

const GRID_SIZE = 20;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<VideoProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    selectedSceneId: null,
    showGrid: true,
  });

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project from localStorage only
      const { projectStorage } = await import("@/lib/storage/projects");
      const project = await projectStorage.getProject(projectId);

      if (!project) {
        throw new Error("Project not found");
      }

      setProject(project);
    } catch (error) {
      console.error("Error loading project:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load project";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  // No longer need to initialize positions - cards are always centered

  // Poll for project updates during generation
  useEffect(() => {
    if (!project || project.status === "completed") return;

    const pollInterval = setInterval(async () => {
      try {
        // Poll for updates from localStorage
        const { projectStorage } = await import("@/lib/storage/projects");
        const updatedProject = await projectStorage.getProject(projectId);
        if (
          updatedProject &&
          new Date(updatedProject.updatedAt) > new Date(project.updatedAt)
        ) {
          console.log("Project updated, refreshing...", updatedProject);
          setProject(updatedProject);
        }
      } catch (error) {
        console.error("Error polling for project updates:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [project, projectId]);

  // Removed unused project update handler

  const handleBack = () => {
    router.push("/");
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as ViewMode);
  };

  // Removed unused zoom and grid handlers since cards are fixed in position

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only deselect scenes when clicking on canvas background
    if (e.target === canvasRef.current) {
      setCanvasState((prev) => ({
        ...prev,
        selectedSceneId: null,
      }));
    }
  }, []);

  // Removed drag handling - cards are now fixed in position

  const handleSceneSelect = useCallback((sceneId: string) => {
    setCanvasState((prev) => ({
      ...prev,
      selectedSceneId: sceneId,
    }));
  }, []);

  const handleSceneEdit = useCallback(() => {
    // TODO: Implement scene editing
    toast.info("Scene editing not implemented yet");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <ArrowLeft className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No project data available</p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <ProjectProvider>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header - Only 3 components as requested */}
          <div className="flex items-center justify-between p-4 bg-background/20 backdrop-blur-xs border-b relative z-30">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {/* Title */}
            <h1 className="text-xl font-semibold">{project.title}</h1>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ViewToggle
                value={viewMode}
                onValueChange={handleViewModeChange}
                options={[
                  { value: "canvas", label: "Canvas", icon: Grid3X3 },
                  { value: "video", label: "Editor", icon: Video },
                ]}
              />
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {viewMode === "canvas" && (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  {/* Fullscreen Grid Canvas */}
                  <div
                    ref={canvasRef}
                    className="absolute inset-0 overflow-hidden bg-muted/20"
                    onMouseDown={handleCanvasMouseDown}
                  >
                    {/* Grid Background - Static */}
                    {canvasState.showGrid && (
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `
                              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                            `,
                          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                        }}
                      />
                    )}

                    {/* Canvas Content with Centered Scene Cards */}
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `scale(${canvasState.zoom})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-5 w-[640px] h-[358px]">
                          <AnimatePresence>
                            {project.scenes.map((scene, index) => (
                              <motion.div
                                key={scene.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full"
                                style={{
                                  gridColumn: index % 2 === 0 ? 1 : 2,
                                  gridRow: index < 2 ? 1 : 2,
                                }}
                              >
                                <SceneImage
                                  scene={scene}
                                  index={index}
                                  isSelected={
                                    canvasState.selectedSceneId === scene.id
                                  }
                                  onSelect={() => handleSceneSelect(scene.id)}
                                  onDragStart={() => {}}
                                  onDragMove={() => {}}
                                  onDragEnd={() => {}}
                                  onEdit={handleSceneEdit}
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Instructions */}
                    {project.scenes.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Grid3X3 className="h-12 w-12 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            Canvas Ready
                          </h3>
                          <p>
                            Your scenes will appear here once generation starts.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {viewMode === "video" && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-center p-8"
                >
                  <VideoPlayer
                    project={project}
                    width={800}
                    height={450}
                    className="max-w-4xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ProjectProvider>
    </SessionProvider>
  );
}
