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
        <div className="min-h-screen w-full relative rounded-4xl overflow-hidden">
          {/* Prismatic Aurora Burst - Multi-layered Gradient */}
          <div
            className="absolute inset-0 z-0 hidden dark:block"
            style={{
              background: `
          radial-gradient(ellipse 120% 80% at 70% 20%, rgba(255, 20, 147, 0.15), transparent 50%),
          radial-gradient(ellipse 100% 60% at 30% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
          radial-gradient(ellipse 90% 70% at 50% 0%, rgba(138, 43, 226, 0.18), transparent 65%),
          radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
          #000000
        `,
            }}
          />

          {/* Aurora Dream Diagonal Flow */}
          <div
            className="absolute inset-0 z-0 dark:hidden"
            style={{
              background: `
         radial-gradient(ellipse 80% 60% at 5% 40%, rgba(175, 109, 255, 0.48), transparent 67%),
        radial-gradient(ellipse 70% 60% at 45% 45%, rgba(255, 100, 180, 0.41), transparent 67%),
        radial-gradient(ellipse 62% 52% at 83% 76%, rgba(255, 235, 170, 0.44), transparent 63%),
        radial-gradient(ellipse 60% 48% at 75% 20%, rgba(120, 190, 255, 0.36), transparent 66%),
        linear-gradient(45deg, #f7eaff 0%, #fde2ea 100%)
      `,
            }}
          />

          <Container className="py-16 space-y-16 z-10 relative">
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
        </div>
      </LayoutMain>
    </Layout>
  );
}
