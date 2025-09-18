"use client";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const suggestions = [
  "Create a product demo video for a new smartphone",
  "Make a travel vlog about tropical destinations",
  "Produce a cooking tutorial for Italian pasta",
  "Design a corporate training video",
  "Build a fitness workout demonstration",
  "Create a real estate property showcase",
];

interface HeroPromptProps {
  onProjectCreate: (description: string) => void;
  isCreating?: boolean;
}

export function HeroPrompt({
  onProjectCreate,
  isCreating = false,
}: HeroPromptProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onProjectCreate(input.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-2xl"
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-gradient">
            Create Your Vision
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Describe your video idea and watch AI bring it to life with stunning
            visuals, perfect pacing, and professional quality.
          </p>
        </div>

        <Card className="card-glass max-w-3xl mx-auto p-8 md:p-12">
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground text-center">
                What&apos;s your video about?
              </h2>

              {/* Input - Following AI SDK pattern */}
              <div className="w-full max-w-2xl mx-auto relative">
                <Textarea
                  value={input}
                  placeholder="Tell us what your video should be about. Be as detailed as you like - the more specific, the better the results!"
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full resize-none rounded-xl border bg-background shadow-sm p-3 min-h-[120px] max-h-48 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  maxLength={1000}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSubmit(e as React.FormEvent);
                      }
                    }
                  }}
                />
              </div>

              {/* Character count and feedback */}
              <div className="flex justify-between items-center text-sm text-muted-foreground max-w-2xl mx-auto">
                <span>{input.length}/1000 characters</span>
                <span className="text-purple-600 font-medium">
                  {input.length > 50
                    ? "Great detail!"
                    : "Add more details for better results"}
                </span>
              </div>
              {/* Suggestions - Following AI SDK pattern */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Need inspiration? Try these examples:
                </p>
                <Suggestions>
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestionClick}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
              </div>
            </div>

            {/* Alternative submit button */}
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  input.trim() &&
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                }
                disabled={!input.trim() || isCreating}
                className="btn-gradient p-6 text-lg cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Video
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
