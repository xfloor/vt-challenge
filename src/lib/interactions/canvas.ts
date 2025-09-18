"use client";

import { Position } from "@/types/scene";
import { PanInfo, useMotionValue } from "motion/react";
import { useCallback, useState } from "react";

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  currentPosition: Position;
  delta: { x: number; y: number };
}

export interface ResizeState {
  isResizing: boolean;
  startSize: { width: number; height: number };
  currentSize: { width: number; height: number };
  delta: { width: number; height: number };
}

export interface CanvasInteractionProps {
  position: Position;
  onPositionChange: (position: Position) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  disabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

export function useCanvasDrag({
  position,
  onPositionChange,
  onDragStart,
  onDragEnd,
  disabled = false,
  snapToGrid = true,
  gridSize = 20,
  bounds,
}: CanvasInteractionProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: position,
    currentPosition: position,
    delta: { x: 0, y: 0 },
  });

  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);

  const snapToGridValue = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const constrainToBounds = useCallback(
    (pos: Position) => {
      if (!bounds) return pos;

      return {
        x: Math.max(bounds.minX || 0, Math.min(bounds.maxX || Infinity, pos.x)),
        y: Math.max(bounds.minY || 0, Math.min(bounds.maxY || Infinity, pos.y)),
        width: position.width,
        height: position.height,
      };
    },
    [bounds, position.width, position.height]
  );

  const handleDragStart = useCallback(() => {
    if (disabled) return;

    setDragState({
      isDragging: true,
      startPosition: position,
      currentPosition: position,
      delta: { x: 0, y: 0 },
    });

    onDragStart?.();
  }, [disabled, position, onDragStart]);

  const handleDrag = useCallback(
    (_event: any, info: PanInfo) => {
      if (disabled || !dragState.isDragging) return;

      const newX = snapToGridValue(position.x + info.offset.x);
      const newY = snapToGridValue(position.y + info.offset.y);

      const newPosition = constrainToBounds({
        x: newX,
        y: newY,
        width: position.width,
        height: position.height,
      });

      setDragState((prev) => ({
        ...prev,
        currentPosition: newPosition,
        delta: {
          x: newPosition.x - prev.startPosition.x,
          y: newPosition.y - prev.startPosition.y,
        },
      }));

      x.set(newPosition.x);
      y.set(newPosition.y);
    },
    [
      disabled,
      dragState.isDragging,
      position,
      snapToGridValue,
      constrainToBounds,
      x,
      y,
    ]
  );

  const handleDragEnd = useCallback(
    (_event: any, info: PanInfo) => {
      if (disabled || !dragState.isDragging) return;

      const finalX = snapToGridValue(position.x + info.offset.x);
      const finalY = snapToGridValue(position.y + info.offset.y);

      const finalPosition = constrainToBounds({
        x: finalX,
        y: finalY,
        width: position.width,
        height: position.height,
      });

      onPositionChange(finalPosition);

      setDragState({
        isDragging: false,
        startPosition: finalPosition,
        currentPosition: finalPosition,
        delta: { x: 0, y: 0 },
      });

      onDragEnd?.();
    },
    [
      disabled,
      dragState.isDragging,
      position,
      snapToGridValue,
      constrainToBounds,
      onPositionChange,
      onDragEnd,
    ]
  );

  return {
    x,
    y,
    dragState,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
}

export function useCanvasResize({
  position,
  onPositionChange,
  onResizeStart,
  onResizeEnd,
  disabled = false,
  snapToGrid = true,
  gridSize = 20,
  minWidth = 100,
  minHeight = 56,
  maxWidth = 800,
  maxHeight = 600,
}: CanvasInteractionProps & {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startSize: { width: position.width, height: position.height },
    currentSize: { width: position.width, height: position.height },
    delta: { width: 0, height: 0 },
  });

  const width = useMotionValue(position.width);
  const height = useMotionValue(position.height);

  const snapToGridValue = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const constrainSize = useCallback(
    (size: { width: number; height: number }) => {
      return {
        width: Math.max(minWidth, Math.min(maxWidth, size.width)),
        height: Math.max(minHeight, Math.min(maxHeight, size.height)),
      };
    },
    [minWidth, maxWidth, minHeight, maxHeight]
  );

  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;

      event.stopPropagation();

      setResizeState({
        isResizing: true,
        startSize: { width: position.width, height: position.height },
        currentSize: { width: position.width, height: position.height },
        delta: { width: 0, height: 0 },
      });

      onResizeStart?.();
    },
    [disabled, position.width, position.height, onResizeStart]
  );

  const handleResizeMove = useCallback(
    (event: React.MouseEvent) => {
      if (disabled || !resizeState.isResizing) return;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const newWidth = snapToGridValue(event.clientX - rect.left);
      const newHeight = snapToGridValue(event.clientY - rect.top);

      const newSize = constrainSize({
        width: newWidth,
        height: newHeight,
      });

      setResizeState((prev) => ({
        ...prev,
        currentSize: newSize,
        delta: {
          width: newSize.width - prev.startSize.width,
          height: newSize.height - prev.startSize.height,
        },
      }));

      width.set(newSize.width);
      height.set(newSize.height);
    },
    [
      disabled,
      resizeState.isResizing,
      snapToGridValue,
      constrainSize,
      width,
      height,
    ]
  );

  const handleResizeEnd = useCallback(() => {
    if (disabled || !resizeState.isResizing) return;

    const finalSize = constrainSize(resizeState.currentSize);

    onPositionChange({
      ...position,
      width: finalSize.width,
      height: finalSize.height,
    });

    setResizeState({
      isResizing: false,
      startSize: finalSize,
      currentSize: finalSize,
      delta: { width: 0, height: 0 },
    });

    onResizeEnd?.();
  }, [
    disabled,
    resizeState.isResizing,
    resizeState.currentSize,
    constrainSize,
    position,
    onPositionChange,
    onResizeEnd,
  ]);

  return {
    width,
    height,
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
}

export function useCanvasSelection() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isActive: boolean;
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isActive: false,
  });

  const selectItem = useCallback((id: string) => {
    setSelectedItems((prev) => new Set([...prev, id]));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const startSelectionBox = useCallback((x: number, y: number) => {
    setSelectionBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      isActive: true,
    });
  }, []);

  const updateSelectionBox = useCallback((x: number, y: number) => {
    setSelectionBox((prev) => ({
      ...prev,
      endX: x,
      endY: y,
    }));
  }, []);

  const endSelectionBox = useCallback(() => {
    setSelectionBox((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const isItemInSelectionBox = useCallback(
    (itemBounds: { x: number; y: number; width: number; height: number }) => {
      if (!selectionBox.isActive) return false;

      const boxLeft = Math.min(selectionBox.startX, selectionBox.endX);
      const boxRight = Math.max(selectionBox.startX, selectionBox.endX);
      const boxTop = Math.min(selectionBox.startY, selectionBox.endY);
      const boxBottom = Math.max(selectionBox.startY, selectionBox.endY);

      return !(
        itemBounds.x + itemBounds.width < boxLeft ||
        itemBounds.x > boxRight ||
        itemBounds.y + itemBounds.height < boxTop ||
        itemBounds.y > boxBottom
      );
    },
    [selectionBox]
  );

  return {
    selectedItems,
    selectionBox,
    selectItem,
    deselectItem,
    toggleItemSelection,
    selectAll,
    clearSelection,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    isItemInSelectionBox,
  };
}

export function useCanvasZoom() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const zoomIn = useCallback((factor = 1.2) => {
    setZoom((prev) => Math.min(3, prev * factor));
  }, []);

  const zoomOut = useCallback((factor = 1.2) => {
    setZoom((prev) => Math.max(0.1, prev / factor));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.max(0.1, Math.min(3, level)));
  }, []);

  const panTo = useCallback((x: number, y: number) => {
    setPan({ x, y });
  }, []);

  const panBy = useCallback((deltaX: number, deltaY: number) => {
    setPan((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  return {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    panTo,
    panBy,
  };
}

// Utility functions for canvas interactions
export const canvasUtils = {
  // Calculate distance between two points
  distance: (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  // Check if point is inside rectangle
  pointInRect: (
    point: { x: number; y: number },
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ) => {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  },

  // Get intersection of two rectangles
  rectIntersection: (
    rect1: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    rect2: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ) => {
    const left = Math.max(rect1.x, rect2.x);
    const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const top = Math.max(rect1.y, rect2.y);
    const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (left < right && top < bottom) {
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
    }

    return null;
  },

  // Snap value to grid
  snapToGrid: (value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  },

  // Constrain value to bounds
  constrain: (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  },
};
