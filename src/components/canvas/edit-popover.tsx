"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EditPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (newPrompt: string) => void;
  currentPrompt: string;
  sceneIndex: number;
  className?: string;
}

interface EditState {
  prompt: string;
  isGenerating: boolean;
  isValid: boolean;
  error: string | null;
}

export function EditPopover({
  isOpen,
  onClose,
  onEdit,
  currentPrompt,
  sceneIndex,
  className = "",
}: EditPopoverProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editState, setEditState] = useState<EditState>({
    prompt: currentPrompt,
    isGenerating: false,
    isValid: true,
    error: null,
  });

  // Reset state when popover opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditState({
        prompt: currentPrompt,
        isGenerating: false,
        isValid: true,
        error: null,
      });
      // Focus textarea after animation
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentPrompt]);

  const validatePrompt = useCallback((prompt: string): boolean => {
    return prompt.trim().length >= 10 && prompt.trim().length <= 500;
  }, []);

  const handlePromptChange = useCallback(
    (value: string) => {
      const isValid = validatePrompt(value);
      setEditState((prev) => ({
        ...prev,
        prompt: value,
        isValid,
        error: isValid ? null : "Prompt must be between 10 and 500 characters",
      }));
    },
    [validatePrompt]
  );

  const handleSave = useCallback(async () => {
    if (!editState.isValid || editState.isGenerating) return;

    const trimmedPrompt = editState.prompt.trim();
    if (trimmedPrompt === currentPrompt.trim()) {
      onClose();
      return;
    }

    setEditState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onEdit(trimmedPrompt);
      toast.success("Scene prompt updated successfully");
    } catch (error) {
      setEditState((prev) => ({
        ...prev,
        isGenerating: false,
        error:
          error instanceof Error ? error.message : "Failed to update prompt",
      }));
      toast.error("Failed to update scene prompt");
    }
  }, [
    editState.isValid,
    editState.isGenerating,
    editState.prompt,
    currentPrompt,
    onEdit,
    onClose,
  ]);

  const handleCancel = useCallback(() => {
    if (editState.isGenerating) return;
    onClose();
  }, [editState.isGenerating, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  const handleGenerateSuggestion = useCallback(async () => {
    if (editState.isGenerating) return;

    setEditState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Simulate AI suggestion generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const suggestions = [
        "A cinematic shot of a bustling city street at sunset, with warm golden light reflecting off glass buildings and people walking with long shadows",
        "A dramatic close-up of weathered hands holding a vintage camera, with shallow depth of field and warm, nostalgic lighting",
        "An aerial view of a serene mountain lake surrounded by autumn trees, with mist rising from the water and soft morning light",
        "A dynamic action shot of a dancer in mid-leap, captured with motion blur and dramatic lighting against a dark background",
      ];

      const randomSuggestion =
        suggestions[Math.floor(Math.random() * suggestions.length)];

      setEditState((prev) => ({
        ...prev,
        prompt: randomSuggestion,
        isValid: true,
        error: null,
      }));

      toast.success("AI suggestion generated");
    } catch (error) {
      setEditState((prev) => ({
        ...prev,
        isGenerating: false,
        error: "Failed to generate suggestion",
      }));
      toast.error("Failed to generate AI suggestion");
    } finally {
      setEditState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [editState.isGenerating]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className={`relative w-full max-w-2xl mx-4 mb-4 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Edit Scene {sceneIndex + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={editState.isGenerating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Scene Description</label>
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={editState.prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the scene you want to generate..."
                    className={`
                      min-h-[120px] resize-none
                      ${
                        !editState.isValid
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }
                    `}
                    disabled={editState.isGenerating}
                  />

                  {/* Character Count */}
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded">
                    {editState.prompt.length}/500
                  </div>
                </div>

                {/* Error Message */}
                {editState.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-red-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {editState.error}
                  </motion.div>
                )}
              </div>

              {/* AI Suggestion Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleGenerateSuggestion}
                  disabled={editState.isGenerating}
                  className="flex items-center gap-2"
                >
                  {editState.isGenerating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate AI Suggestion
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={editState.isGenerating}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={!editState.isValid || editState.isGenerating}
                  className="flex items-center gap-2"
                >
                  {editState.isGenerating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="text-xs text-muted-foreground text-center">
                Press{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded">
                  Cmd/Ctrl + Enter
                </kbd>{" "}
                to save,
                <kbd className="px-1 py-0.5 bg-muted rounded ml-1">Esc</kbd> to
                cancel
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
