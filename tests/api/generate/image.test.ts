import { POST } from "@/app/api/generate/image/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/generate/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/image",
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
        "http://localhost:3000/api/generate/image",
        {
          method: "POST",
          body: JSON.stringify({ model: "fast" }),
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

    it("should return 200 with valid image data for valid prompt", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/image",
        {
          method: "POST",
          body: JSON.stringify({
            prompt:
              "1940s Italian workshop with vintage car parts, warm lighting, cinematic, 16:9",
            model: "fast",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("imageData");
      expect(typeof data.imageData).toBe("string");
      expect(data.imageData.length).toBeGreaterThan(0);
      expect(data).toHaveProperty("width");
      expect(data).toHaveProperty("height");
      expect(typeof data.width).toBe("number");
      expect(typeof data.height).toBe("number");
    });

    it("should handle rate limiting gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/generate/image",
        {
          method: "POST",
          body: JSON.stringify({
            prompt: "Test prompt for rate limiting",
            model: "fast",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);

      // Should handle rate limits gracefully
      expect([200, 429].includes(response.status)).toBe(true);
    });
  });
});
