import { POST } from "@/app/api/generate/title/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/generate/title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/title",
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

    it("should return 400 for missing prompt", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/title",
        {
          method: "POST",
          body: JSON.stringify({ prompt: "" }),
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
      expect(data.message).toContain("prompt");
    });

    it("should return 400 for prompt too long", async () => {
      const longPrompt = "a".repeat(1001);
      const request = new NextRequest(
        "http://localhost:3000/api/generate/title",
        {
          method: "POST",
          body: JSON.stringify({ prompt: longPrompt }),
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

    it("should return 200 with valid title for valid prompt", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/title",
        {
          method: "POST",
          body: JSON.stringify({
            prompt:
              "I want to create a video story about the history of Ferrari",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);

      // This test should fail initially since the endpoint doesn't exist yet
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("title");
      expect(typeof data.title).toBe("string");
      expect(data.title.length).toBeGreaterThan(0);
      expect(data.title.length).toBeLessThanOrEqual(100);
    });

    it("should handle AI provider errors gracefully", async () => {
      // This test verifies error handling when AI provider fails
      const request = new NextRequest(
        "http://localhost:3000/api/generate/title",
        {
          method: "POST",
          body: JSON.stringify({
            prompt: "Test prompt that might cause AI provider to fail",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Mock environment to simulate AI provider failure
      const originalKey = process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_API_KEY = "invalid-key";

      const response = await POST(request);

      // Restore environment
      process.env.OPENROUTER_API_KEY = originalKey;

      // Should handle errors gracefully
      expect([200, 500]).toContain(response.status);
    });
  });
});

