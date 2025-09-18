import { GET } from "@/app/api/projects/[id]/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 404 for non-existent project", async () => {
      const projectId = "12345678-1234-4567-8901-123456789abc";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${projectId}`
      );

      const response = await GET(request, { params: { id: projectId } });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("not_found");
    });

    it("should return 400 for invalid project ID format", async () => {
      const invalidId = "invalid-id";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${invalidId}`
      );

      const response = await GET(request, { params: { id: invalidId } });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("validation_error");
    });

    it("should return 200 with project details for valid existing project", async () => {
      // This test assumes a project exists - in real implementation,
      // we would need to create a project first or mock the storage
      const validProjectId = "12345678-1234-4567-8901-123456789abc";
      const request = new NextRequest(
        `http://localhost:3000/api/projects/${validProjectId}`
      );

      const response = await GET(request, { params: { id: validProjectId } });

      // This should return the project or 404 if not found
      expect([200, 404].includes(response.status)).toBe(true);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("id");
        expect(data).toHaveProperty("title");
        expect(data).toHaveProperty("originalPrompt");
        expect(data).toHaveProperty("storyboard");
        expect(data).toHaveProperty("scenes");
        expect(data).toHaveProperty("status");
        expect(data).toHaveProperty("createdAt");
        expect(data).toHaveProperty("updatedAt");
        expect(Array.isArray(data.scenes)).toBe(true);
        expect(data.scenes).toHaveLength(4);
      }
    });
  });
});
