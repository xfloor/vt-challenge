"use client";

import { Scene, SceneStatus, VideoProject } from "@/types/project";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from "remotion";

interface VideoCompositionProps {
  project: VideoProject;
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

interface SceneSequenceProps {
  scene: Scene;
  index: number;
}

function SceneSequence({ scene, index }: SceneSequenceProps) {
  // Simplified - no complex animations for now
  const opacity = 1;
  const scale = 1;

  // Always show something for each scene, even if no image data
  if (!scene.imageData) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: `hsl(${index * 60}, 70%, 50%)`, // Different color for each scene
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 48,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Scene {index + 1}
        </div>
        <div
          style={{
            color: "white",
            fontSize: 24,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {scene.status === SceneStatus.GENERATING
            ? "Generating..."
            : "No Image Data"}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Always show a background first */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: `hsl(${index * 60}, 70%, 30%)`, // Bright colored background
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 48,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Scene {index + 1} - {scene.imageData ? "Has Image" : "No Image"}
        </div>
      </div>

      {/* Main Scene Image - only if we have image data */}
      {scene.imageData && (
        <Img
          src={`data:${
            scene.imageData.startsWith("PHN2Zy") ||
            scene.imageData.startsWith("iVBORw0KGgo")
              ? "image/svg+xml"
              : "image/jpeg"
          };base64,${scene.imageData}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          alt={`Scene ${index + 1}`}
        />
      )}

      {/* Simple Scene Number - always visible */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: "8px 16px",
          borderRadius: 8,
        }}
      >
        {index + 1} / 4
      </div>
    </AbsoluteFill>
  );
}

export function VideoComposition({ project }: VideoCompositionProps) {
  // Calculate scene durations - 2 seconds each (60 frames at 30fps)
  const sceneDuration = 60; // 2 seconds at 30fps
  const sceneDurations = useMemo(() => {
    return [0, 1, 2, 3].map((i) => ({
      startFrame: i * sceneDuration,
      duration: sceneDuration,
    }));
  }, [sceneDuration]);

  // Background music (optional)
  const hasBackgroundMusic = false; // Set to true if you have background music

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background Music */}
      {hasBackgroundMusic && (
        <Audio src={staticFile("background-music.mp3")} volume={0.3} />
      )}

      {/* Scene Sequences - Ensure we always have 4 scenes */}
      {Array.from({ length: 4 }, (_, index) => {
        const scene = project.scenes[index] || {
          id: `fallback-${index}`,
          status: SceneStatus.GENERATING,
          imageData: null,
          prompt: `Scene ${index + 1}`,
        };
        const { startFrame, duration } = sceneDurations[index];
        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={duration}
          >
            <SceneSequence scene={scene} index={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

// Export default composition for Remotion
export default VideoComposition;
