import { POST } from "@/app/api/generate/storyboard/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/generate/storyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/storyboard",
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

    it("should return 400 for missing required fields", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/storyboard",
        {
          method: "POST",
          body: JSON.stringify({ prompt: "test" }),
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

    it("should return 200 with valid storyboard for valid input", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/storyboard",
        {
          method: "POST",
          body: JSON.stringify({
            prompt:
              "I want to create a video story about the history of Ferrari",
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
      expect(data).toHaveProperty("storyboard");
      expect(typeof data.storyboard).toBe("string");
      expect(data.storyboard.length).toBeGreaterThan(0);
      expect(data.storyboard.length).toBeLessThanOrEqual(2000);
    });
  });
});

