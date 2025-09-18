"use client";

import { ProjectInputForm } from "@/components/forms/project-input";
import {
  Container,
  Layout,
  LayoutHeader,
  LayoutMain,
} from "@/components/layout/layout";
import { ProjectCards } from "@/components/projects/project-cards";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToastActions } from "@/components/ui/toast";
import { projectStorage } from "@/lib/storage/projects";
import { sessionStorage } from "@/lib/storage/session";
import { VideoProject } from "@/types/project";
import {
  ArrowRight,
  FileVideo,
  Palette,
  Play,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface HomepageProps {
  onProjectCreate?: (projectId: string) => void;
  onProjectSelect?: (projectId: string) => void;
}

export function Homepage({ onProjectCreate, onProjectSelect }: HomepageProps) {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const toast = useToastActions();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Get session and onboarding state
      const session = sessionStorage.getSession();
      const onboardingState = sessionStorage.getOnboardingState();

      setIsFirstTime(!onboardingState.completed);

      // Load recent projects
      const recentProjects = await projectStorage.getRecentProjects(6);
      setProjects(recentProjects);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load projects", "Please try refreshing the page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = async (projectId: string) => {
    // Refresh projects list
    await loadInitialData();

    // Close input form
    setShowProjectInput(false);

    // Mark onboarding as completed if first time
    if (isFirstTime) {
      sessionStorage.completeOnboarding();
      setIsFirstTime(false);
    }

    // Notify parent
    if (onProjectCreate) {
      onProjectCreate(projectId);
    }

    toast.success(
      "Project created!",
      "Your video project has been created successfully"
    );
  };

  const handleProjectSelect = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleGetStarted = () => {
    setShowProjectInput(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Layout>
      <LayoutHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileVideo className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">AI Video Maker</h1>
          </div>

          <Button onClick={handleGetStarted} className="btn-gradient">
            <Sparkles className="h-4 w-4 mr-2" />
            Create Video
          </Button>
        </div>
      </LayoutHeader>

      <LayoutMain className="py-8">
        <Container size="xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-3 w-3" />
              AI-Powered Video Creation
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Create stunning videos with{" "}
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                AI magic
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform your ideas into professional videos in minutes. Just
              describe what you want, and watch AI bring your vision to life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Creating
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {projects.length > 0 && (
                <Button variant="outline" size="lg" className="px-8">
                  <FileVideo className="h-4 w-4 mr-2" />
                  View Projects
                </Button>
              )}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Generate complete video storyboards and visuals in under 2
                  minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <Palette className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Creative Control</CardTitle>
                <CardDescription>
                  Edit scenes, refine prompts, and customize every aspect of
                  your video
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>No Experience Needed</CardTitle>
                <CardDescription>
                  From beginners to pros, create professional videos without
                  technical skills
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Recent Projects or First Time Experience */}
          {isFirstTime ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Welcome to AI Video Maker!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Ready to create your first AI-generated video? It&apos;s
                    easier than you think.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Describe your video idea</p>
                        <p className="text-sm text-muted-foreground">
                          Tell us what you want your video to be about
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-left">
                      <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium">
                          AI creates your storyboard
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Watch as AI generates scenes and visuals
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-left">
                      <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Edit and export</p>
                        <p className="text-sm text-muted-foreground">
                          Customize scenes and download your video
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create My First Video
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : projects.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Recent Projects</h2>
                  <p className="text-muted-foreground">
                    Continue working on your video projects
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowProjectInput(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>

              <ProjectCards
                projects={projects}
                onProjectSelect={handleProjectSelect}
                loading={isLoading}
                error={null}
                onRetry={loadInitialData}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center mx-auto mb-6">
                  <FileVideo className="h-12 w-12 text-purple-500" />
                </div>

                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by creating your first AI-generated video project
                </p>

                <Button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            </motion.div>
          )}
        </Container>
      </LayoutMain>

      {/* Project Input Modal */}
      {showProjectInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <ProjectInputForm
              onProjectCreated={handleProjectCreated}
              onCancel={() => setShowProjectInput(false)}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
