import { POST } from "@/app/api/generate/scene-prompts/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/generate/scene-prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/scene-prompts",
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("validation_error");
    });

    it("should return 200 with exactly 4 scene prompts", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/scene-prompts",
        {
          method: "POST",
          body: JSON.stringify({
            storyboard: "Scene 1: Enzo Ferrari's workshop in 1940s Italy...",
            title: "The Ferrari Legacy: From Dreams to Racing Glory",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("prompts");
      expect(Array.isArray(data.prompts)).toBe(true);
      expect(data.prompts).toHaveLength(4);

      data.prompts.forEach((prompt: string) => {
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(0);
        expect(prompt.length).toBeLessThanOrEqual(500);
      });
    });
  });
});

