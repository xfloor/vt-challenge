"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Scene, SceneStatus } from "@/types/project";
import { Edit3, Image as ImageIcon, Play, RefreshCw, X } from "lucide-react";
import { useCallback, useState } from "react";
import { EditPopover } from "./edit-popover";

interface SceneImageProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDragMove: (e: React.MouseEvent) => void;
  onDragEnd: () => void;
  onEdit: (newPrompt: string) => void;
  className?: string;
}

export function SceneImage({
  scene,
  index,
  isSelected,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEdit,
  className = "",
}: SceneImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showEditPopover, setShowEditPopover] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoaded(false);
    setImageError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setImageError(false);
    setIsImageLoaded(false);
    // Force image reload by adding timestamp
    const img = document.querySelector(
      `img[data-scene-id="${scene.id}"]`
    ) as HTMLImageElement;
    if (img) {
      // Detect image type based on base64 content
      const isSvg =
        scene.imageData.startsWith("PHN2Zy") ||
        scene.imageData.startsWith("iVBORw0KGgo");
      const mimeType = isSvg ? "image/svg+xml" : "image/jpeg";
      img.src = `data:${mimeType};base64,${scene.imageData}?t=${Date.now()}`;
    }
  }, [scene.id, scene.imageData]);

  const handleEdit = useCallback(
    (newPrompt: string) => {
      onEdit(newPrompt);
      setShowEditPopover(false);
    },
    [onEdit]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Only select if we're not dragging
      if (!isDragging) {
        onSelect();
      }
    },
    [onSelect, isDragging]
  );

  const handleCardMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Only start dragging if not clicking on the edit button
      if (!(e.target as HTMLElement).closest("[data-edit-button]")) {
        setIsDragging(true);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        onDragStart(e);
      }
    },
    [onDragStart]
  );

  const handleCardMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStartPos) {
        const deltaX = Math.abs(e.clientX - dragStartPos.x);
        const deltaY = Math.abs(e.clientY - dragStartPos.y);

        // Only start actual dragging if we've moved more than 5 pixels
        if (deltaX > 5 || deltaY > 5) {
          onDragMove(e);
        }
      }
    },
    [isDragging, dragStartPos, onDragMove]
  );

  const handleCardMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartPos(null);
      onDragEnd();
    }
  }, [isDragging, onDragEnd]);

  const getStatusIcon = () => {
    switch (scene.status) {
      case SceneStatus.GENERATING:
        return <LoadingSpinner size="sm" className="text-yellow-600" />;
      case SceneStatus.EDITING:
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case SceneStatus.COMPLETED:
        return <Play className="h-4 w-4 text-green-600" />;
      case SceneStatus.FAILED:
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <ImageIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (scene.status) {
      case SceneStatus.GENERATING:
        return "border-yellow-400 bg-yellow-50";
      case SceneStatus.EDITING:
        return "border-blue-400 bg-blue-50";
      case SceneStatus.COMPLETED:
        return "border-green-400 bg-green-50";
      case SceneStatus.FAILED:
        return "border-red-400 bg-red-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const isInteractive =
    scene.status === SceneStatus.COMPLETED ||
    scene.status === SceneStatus.FAILED;

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onMouseDown={handleCardMouseDown}
      onMouseMove={handleCardMouseMove}
      onMouseUp={handleCardMouseUp}
    >
      <Card
        className={`
          relative select-none overflow-hidden cursor-pointer transition-all duration-200
          ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
          ${getStatusColor()}
          ${isInteractive ? "hover:shadow-lg" : ""}
        `}
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "16/9",
        }}
      >
        <CardContent className="p-0 h-full relative">
          {/* Scene Number Badge */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
              {index + 1}
            </div>
          </div>

          {/* Status Icon */}
          <div className="absolute top-2 right-2 z-10">{getStatusIcon()}</div>

          {/* Image Content */}
          <div className="relative w-full h-full">
            {scene.imageData && !imageError ? (
              <>
                <img
                  data-scene-id={scene.id}
                  src={`data:${
                    scene.imageData.startsWith("PHN2Zy") ||
                    scene.imageData.startsWith("iVBORw0KGgo")
                      ? "image/svg+xml"
                      : "image/jpeg"
                  };base64,${scene.imageData}`}
                  alt={`Scene ${index + 1}: ${scene.prompt}`}
                  className={`
                    w-full h-full object-cover transition-opacity duration-200
                    ${isImageLoaded ? "opacity-100" : "opacity-0"}
                  `}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />

                {/* Loading Overlay */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </>
            ) : (
              /* Placeholder for missing/failed images */
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                {imageError ? (
                  <div className="text-center">
                    <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 mb-2">Failed to load</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry();
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No image</p>
                  </div>
                )}
              </div>
            )}

            {/* Overlay Actions */}
            {isHovered && isInteractive && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button
                  data-edit-button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditPopover(true);
                  }}
                  className="opacity-90 hover:opacity-100"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Scene Prompt (collapsed) */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-white text-xs line-clamp-2 leading-tight">
              {scene.prompt}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Popover */}
      <EditPopover
        isOpen={showEditPopover}
        onClose={() => setShowEditPopover(false)}
        onEdit={handleEdit}
        currentPrompt={scene.prompt}
        sceneIndex={index}
      />
    </div>
  );
}
