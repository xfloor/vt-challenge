"use client";

import { HeroPrompt } from "@/components/ai-elements/hero-prompt";
import { UserProjects } from "@/components/ai-elements/user-projects";
import { Container, Layout, LayoutMain } from "@/components/layout/layout";
import { useToastActions } from "@/components/ui/toast";
import { generationQueue, QueuePriority } from "@/lib/ai/queue";
import { projectStorage } from "@/lib/storage/projects";
import { ProjectStatus, SceneStatus, VideoProject } from "@/types/project";
import { getDefaultScenePositions } from "@/types/scene";
import { useState } from "react";

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToastActions();

  const handleProjectCreate = async (description: string) => {
    setIsCreating(true);
    try {
      // Create project with initial data (client-side)
      const projectId = crypto.randomUUID();
      const defaultPositions = getDefaultScenePositions();

      const project: VideoProject = {
        id: projectId,
        title:
          description.slice(0, 50) + (description.length > 50 ? "..." : ""),
        originalPrompt: description,
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

      // Save initial project to localStorage
      const saved = await projectStorage.saveProject(project);
      if (!saved) {
        throw new Error("Failed to save project");
      }

      // Add to generation queue with client storage
      await generationQueue.addProjectGenerationTask(
        projectId,
        { useClientStorage: true },
        QueuePriority.HIGH
      );

      toast.success("Project created successfully!");
      // Redirect to loading screen to show AI generation progress
      window.location.href = `/loading?projectId=${projectId}&type=project`;
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      {/*       <LayoutHeader>
        <Container className="flex items-center justify-between py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-3"
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <FileVideo className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">VT Challenge</h1>
          </motion.div>
        </Container>
      </LayoutHeader> */}

      <LayoutMain>
        <Container className="py-16 space-y-16">
          <HeroPrompt
            onProjectCreate={handleProjectCreate}
            isCreating={isCreating}
          />

          <UserProjects
            onCreateNew={() => {
              // Scroll to the top to show the HeroPrompt
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </Container>
      </LayoutMain>
    </Layout>
  );
}
