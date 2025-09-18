"use client";

import { ProjectCards } from "@/components/projects/project-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoProject } from "@/types/project";
import { FileVideo, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface UserProjectsProps {
  onCreateNew: () => void;
}

export function UserProjects({ onCreateNew }: UserProjectsProps) {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Import dynamically to avoid SSR issues
      const { projectStorage } = await import("@/lib/storage/projects");
      const storedProjects = await projectStorage.getProjects();
      setProjects(storedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load projects"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    // Navigate to project detail page
    window.location.href = `/project/${projectId}`;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mx-auto"
      >
        <ProjectCards
          projects={[]}
          onProjectSelect={handleProjectSelect}
          loading={true}
        />
      </motion.div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mx-auto"
      >
        <Card className="card-glass">
          <CardContent className="p-12 text-center">
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto"
              >
                <FileVideo className="h-8 w-8 text-muted-foreground" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  No projects yet
                </h3>
                <p className="text-muted-foreground">
                  Create your first video project to get started
                </p>
              </div>

              <Button onClick={onCreateNew} className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-6xl mx-auto space-y-8"
    >
      <h2 className="text-2xl font-bold w-full text-center">Your projects</h2>
      <ProjectCards
        projects={projects}
        onProjectSelect={handleProjectSelect}
        error={error}
        onRetry={loadProjects}
      />
    </motion.div>
  );
}
