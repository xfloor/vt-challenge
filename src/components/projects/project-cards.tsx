"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProjectStatus, VideoProject } from "@/types/project";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ProjectCardsProps {
  className?: string;
  projects: VideoProject[];
  onProjectSelect: (projectId: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ProjectCards({
  className,
  projects,
  onProjectSelect,
  loading = false,
  error = null,
  onRetry,
}: ProjectCardsProps) {
  const getStatusDisplay = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.GENERATING:
        return { text: "Generating...", color: "text-yellow-600" };
      case ProjectStatus.COMPLETED:
        return { text: "Ready", color: "text-green-600" };
      case ProjectStatus.FAILED:
        return { text: "Failed", color: "text-red-600" };
      case ProjectStatus.EDITING:
        return { text: "Editing", color: "text-blue-600" };
      default:
        return { text: "Unknown", color: "text-gray-600" };
    }
  };

  const getCompletedScenesCount = (project: VideoProject) => {
    return project.scenes.filter((scene) => scene.status === "completed")
      .length;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
        <p className="text-muted-foreground">
          Create your first video project to get started!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => {
        const status = getStatusDisplay(project.status);
        const completedScenes = getCompletedScenesCount(project);
        const totalScenes = project.scenes.length;

        return (
          <Card
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              if (onProjectSelect) {
                onProjectSelect(project.id);
              } else {
                // TODO: Navigate to project detail page
                toast.info("Project detail page not implemented yet");
              }
            }}
          >
            <CardHeader>
              <CardTitle className="line-clamp-2">
                {project.title || "Untitled Project"}
              </CardTitle>
              <div className="flex items-center justify-between text-sm">
                <span className={status.color}>{status.text}</span>
                <span className="text-muted-foreground">
                  {completedScenes}/{totalScenes} scenes
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {project.originalPrompt}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(completedScenes / totalScenes) * 100}%`,
                  }}
                />
              </div>

              {/* Scene thumbnails preview */}
              <div className="grid grid-cols-4 gap-1 mb-3">
                {project.scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className="aspect-video bg-gray-100 rounded border-2 flex items-center justify-center text-xs"
                    style={{
                      borderColor:
                        scene.status === "completed"
                          ? "#22c55e"
                          : scene.status === "generating"
                          ? "#eab308"
                          : "#ef4444",
                    }}
                  >
                    {scene.imageData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:${
                          scene.imageData.startsWith("PHN2Zy") ||
                          scene.imageData.startsWith("iVBORw0KGgo")
                            ? "image/svg+xml"
                            : "image/jpeg"
                        };base64,${scene.imageData}`}
                        alt={`Scene ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-500">{index + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Created {formatDistanceToNow(new Date(project.createdAt))} ago
                </span>
                {project.status === ProjectStatus.GENERATING && (
                  <LoadingSpinner size="sm" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
