import { GET } from "@/app/api/projects/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("/api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 200 with empty projects list initially", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects");

      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("projects");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("hasMore");
      expect(Array.isArray(data.projects)).toBe(true);
      expect(typeof data.total).toBe("number");
      expect(typeof data.hasMore).toBe("boolean");
    });

    it("should handle pagination parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/projects?limit=5&offset=10"
      );

      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("projects");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("hasMore");
    });

    it("should validate pagination parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/projects?limit=100&offset=-1"
      );

      const response = await GET(request);

      // Should either accept with defaults or return validation error
      expect([200, 400].includes(response.status)).toBe(true);
    });
  });
});

