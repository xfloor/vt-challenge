"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SceneStatus, VideoProject } from "@/types/project";
import {
  Grid3X3,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { SceneImage } from "./scene-image";

interface CanvasWorkspaceProps {
  project: VideoProject;
  onSceneEdit?: (sceneId: string, newPrompt: string) => void;
  className?: string;
}

interface CanvasState {
  zoom: number;
  selectedSceneId: string | null;
  showGrid: boolean;
  isFullscreen: boolean;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;
const GRID_SIZE = 20;

export function CanvasWorkspace({
  project,
  onSceneEdit,
  className = "",
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    selectedSceneId: null,
    showGrid: true,
    isFullscreen: false,
  });

  // Removed drag state since cards are now fixed in position

  // No longer need to initialize or update positions - cards are always centered

  const handleZoom = useCallback((delta: number) => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta)),
    }));
  }, []);

  const handleResetView = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  const handleToggleGrid = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      showGrid: !prev.showGrid,
    }));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Deselect any selected scene when clicking on canvas background
    const target = e.target as HTMLElement;
    if (
      target === canvasRef.current ||
      target.classList.contains("canvas-background")
    ) {
      setCanvasState((prev) => ({
        ...prev,
        selectedSceneId: null,
      }));
    }
  }, []);

  const handleSceneDragStart = useCallback(
    (_e: React.MouseEvent, sceneId: string) => {
      setCanvasState((prev) => ({
        ...prev,
        selectedSceneId: sceneId,
      }));
      // No longer handle dragging since cards are fixed in position
    },
    []
  );

  const handleSceneDragMove = useCallback(() => {
    // Disable dragging - cards stay centered
    // This maintains the centered layout while preventing position changes
  }, []);

  const handleSceneDragEnd = useCallback(() => {
    // No longer needed since cards are fixed in position
  }, []);

  const handleSceneSelect = useCallback((sceneId: string) => {
    setCanvasState((prev) => ({
      ...prev,
      selectedSceneId: sceneId,
    }));
  }, []);

  const handleSceneEdit = useCallback(
    (sceneId: string, newPrompt: string) => {
      if (onSceneEdit) {
        onSceneEdit(sceneId, newPrompt);
        toast.success("Scene prompt updated");
      }
    },
    [onSceneEdit]
  );

  const getSceneStatusCount = (status: SceneStatus) => {
    return project.scenes.filter((scene) => scene.status === status).length;
  };

  const completedScenes = getSceneStatusCount(SceneStatus.COMPLETED);
  const generatingScenes = getSceneStatusCount(SceneStatus.GENERATING);
  const failedScenes = getSceneStatusCount(SceneStatus.FAILED);

  return (
    <div className={`relative ${className}`}>
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Canvas Workspace</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{completedScenes}/4 completed</span>
            {generatingScenes > 0 && (
              <span className="text-yellow-600">
                • {generatingScenes} generating
              </span>
            )}
            {failedScenes > 0 && (
              <span className="text-red-600">• {failedScenes} failed</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-ZOOM_STEP)}
            disabled={canvasState.zoom <= MIN_ZOOM}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {Math.round(canvasState.zoom * 100)}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(ZOOM_STEP)}
            disabled={canvasState.zoom >= MAX_ZOOM}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleGrid}
            className={
              canvasState.showGrid ? "bg-primary text-primary-foreground" : ""
            }
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleToggleFullscreen}>
            {canvasState.isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`relative overflow-hidden bg-muted/20 ${
          canvasState.isFullscreen ? "fixed inset-0 z-50" : "h-[600px]"
        }`}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Grid Background - Static */}
        {canvasState.showGrid && (
          <div
            className="absolute inset-0 opacity-20 canvas-background"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            }}
          />
        )}

        {/* Canvas Content */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${canvasState.zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Centered container for cards */}
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
                      isSelected={canvasState.selectedSceneId === scene.id}
                      onSelect={() => handleSceneSelect(scene.id)}
                      onDragStart={(e) => handleSceneDragStart(e, scene.id)}
                      onDragMove={handleSceneDragMove}
                      onDragEnd={handleSceneDragEnd}
                      onEdit={(newPrompt) =>
                        handleSceneEdit(scene.id, newPrompt)
                      }
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
            <Card className="p-8 text-center">
              <CardContent>
                <div className="text-muted-foreground mb-4">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold mb-2">Canvas Ready</h3>
                  <p>Your scenes will appear here once generation starts.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="flex items-center justify-between p-4 bg-background border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(canvasState.zoom * 100)}%</span>
          {canvasState.selectedSceneId && (
            <span>
              Selected: Scene{" "}
              {project.scenes.findIndex(
                (s) => s.id === canvasState.selectedSceneId
              ) + 1}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
