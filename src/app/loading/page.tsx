"use client";

import { LoadingScreen } from "@/components/pages/loading-screen";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoadingPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Invalid Project
          </h1>
          <p className="text-muted-foreground">No project ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen
        projectId={projectId}
        onComplete={(projectId) => {
          // Redirect to project canvas when generation is complete
          window.location.href = `/project/${projectId}`;
        }}
        onCancel={() => {
          // Redirect back to homepage if user cancels
          window.location.href = "/";
        }}
      />
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <LoadingPageContent />
    </Suspense>
  );
}
