"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import { VideoProject } from "@/types/project";
import { Player, PlayerRef } from "@remotion/player";
import { Maximize2, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  project: VideoProject;
  width?: number;
  height?: number;
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
}

export function VideoPlayer({
  project,
  width = 800,
  height = 450,
  className = "",
}: VideoPlayerProps) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Calculate video duration based on project
  const videoDuration = 8; // 8 seconds for 4 scenes (2 seconds each)
  const fps = 30;

  const handlePlayClick = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
    }
  }, []);

  const handlePauseClick = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, []);

  const handleSeek = useCallback(
    (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time * fps);
        setPlayerState((prev) => ({ ...prev, currentTime: time }));
      }
    },
    [fps]
  );

  const handleFullscreen = useCallback(() => {
    if (!playerRef.current) return;

    // Use Remotion player's fullscreen functionality
    if (!playerState.isFullscreen) {
      // Enter fullscreen
      if (containerRef.current) {
        containerRef.current.requestFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
      }
    } else {
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
      }
    }
  }, [playerState.isFullscreen]);

  // Auto-play when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (playerRef.current) {
        playerRef.current.play();
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      }
    }, 1000); // Small delay to ensure player is ready

    return () => clearTimeout(timer);
  }, []);

  // Poll player state for synchronization
  useEffect(() => {
    if (!playerRef.current) return;

    let lastFrame = 0;
    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentFrame = playerRef.current.getCurrentFrame();
        const timeInSeconds = currentFrame / fps;

        // Detect if player is playing by checking if frame is advancing
        const isPlaying = currentFrame !== lastFrame;
        lastFrame = currentFrame;

        setPlayerState((prev) => ({
          ...prev,
          currentTime: timeInSeconds,
          isPlaying,
        }));
      }
    }, 100); // Update every 100ms for smooth UI

    return () => clearInterval(interval);
  }, [fps]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (playerState.isPlaying) {
            handlePauseClick();
          } else {
            handlePlayClick();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    playerState.isPlaying,
    handlePlayClick,
    handlePauseClick,
    handleFullscreen,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className} ${
        playerState.isFullscreen ? "fixed inset-0 z-50 bg-black" : ""
      }`}
    >
      {/* Video Player */}
      <Card
        className={`overflow-hidden ${
          playerState.isFullscreen ? "h-full w-full border-0 rounded-none" : ""
        }`}
      >
        <div
          className={`relative ${
            playerState.isFullscreen ? "h-full w-full" : ""
          }`}
        >
          <Player
            ref={playerRef}
            component={VideoComposition}
            durationInFrames={videoDuration * fps}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={fps}
            style={{
              width: playerState.isFullscreen ? "100vw" : width,
              height: playerState.isFullscreen ? "100vh" : height,
              aspectRatio: "16/9",
            }}
            inputProps={{ project }}
            autoPlay={true}
            loop={true}
          />

          {/* Play/Pause Overlay */}
          {!playerState.isPlaying && !isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Button
                size="lg"
                onClick={handlePlayClick}
                className="rounded-full w-16 h-16"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          )}
        </div>

        {/* Video Controls */}
        <CardContent
          className={`space-y-4 ${
            playerState.isFullscreen
              ? "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
              : "p-4"
          }`}
        >
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {Math.floor(playerState.currentTime / 60)}:
                {(playerState.currentTime % 60).toFixed(0).padStart(2, "0")}
              </span>
              <span>
                {Math.floor(videoDuration / 60)}:
                {(videoDuration % 60).toFixed(0).padStart(2, "0")}
              </span>
            </div>
            <Slider
              value={[playerState.currentTime]}
              onValueChange={(value: number[]) => handleSeek(value[0])}
              max={videoDuration}
              step={0.1}
              className="w-full"
            >
              <SliderTrack>
                <SliderRange />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={
                playerState.isPlaying ? handlePauseClick : handlePlayClick
              }
              className={`rounded-full ${
                playerState.isFullscreen ? "w-20 h-20" : "w-16 h-16"
              }`}
            >
              {playerState.isPlaying ? (
                <Pause
                  className={playerState.isFullscreen ? "h-10 w-10" : "h-8 w-8"}
                />
              ) : (
                <Play
                  className={playerState.isFullscreen ? "h-10 w-10" : "h-8 w-8"}
                />
              )}
            </Button>

            <Button
              variant="ghost"
              size={playerState.isFullscreen ? "lg" : "sm"}
              onClick={handleFullscreen}
              className={playerState.isFullscreen ? "w-12 h-12" : ""}
            >
              <Maximize2
                className={playerState.isFullscreen ? "h-6 w-6" : "h-4 w-4"}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      {!playerState.isFullscreen && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> to
          play/pause,
          <kbd className="px-1 py-0.5 bg-muted rounded ml-1">F</kbd> for
          fullscreen
        </div>
      )}
    </div>
  );
}

// Import the VideoComposition component
import VideoComposition from "./video-composition";
