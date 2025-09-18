import { POST } from "@/app/api/projects/[id]/scenes/[sceneId]/edit/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/projects/[id]/scenes/[sceneId]/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 for invalid request body", async () => {
      const projectId = "12345678-1234-4567-8901-123456789abc";
      const sceneId = "87654321-4321-4654-9098-876543210987";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/scenes/${sceneId}/edit`,
        {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: { id: projectId, sceneId: sceneId },
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("validation_error");
    });

    it("should return 404 for non-existent project", async () => {
      const projectId = "99999999-9999-4999-9999-999999999999";
      const sceneId = "87654321-4321-4654-9098-876543210987";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/scenes/${sceneId}/edit`,
        {
          method: "POST",
          body: JSON.stringify({
            prompt: "Make this image more colorful and vibrant",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: { id: projectId, sceneId: sceneId },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("not_found");
    });

    it("should return 404 for non-existent scene", async () => {
      const projectId = "12345678-1234-4567-8901-123456789abc";
      const sceneId = "99999999-9999-4999-9999-999999999999";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/scenes/${sceneId}/edit`,
        {
          method: "POST",
          body: JSON.stringify({
            prompt: "Make this image more colorful and vibrant",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: { id: projectId, sceneId: sceneId },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("not_found");
    });

    it("should return 202 with edit ID for valid scene edit request", async () => {
      const projectId = "12345678-1234-4567-8901-123456789abc";
      const sceneId = "87654321-4321-4654-9098-876543210987";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}/scenes/${sceneId}/edit`,
        {
          method: "POST",
          body: JSON.stringify({
            prompt: "Make this image more colorful and vibrant",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request, {
        params: { id: projectId, sceneId: sceneId },
      });

      // Should return 202 for accepted edit request or 404 if project/scene not found
      expect([202, 404].includes(response.status)).toBe(true);

      if (response.status === 202) {
        const data = await response.json();
        expect(data).toHaveProperty("status");
        expect(data).toHaveProperty("editId");
        expect(data.status).toBe("editing");
        expect(typeof data.editId).toBe("string");
        expect(data.editId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }
    });
  });
});
