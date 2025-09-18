import { validatePagination, validatePrompt, validateUUID } from "@/types/api";
import { describe, expect, it } from "vitest";

describe("Validation Functions", () => {
  describe("validatePrompt", () => {
    it("should return null for valid prompts", () => {
      expect(validatePrompt("Valid prompt")).toBeNull();
      expect(validatePrompt("A".repeat(50))).toBeNull();
      expect(validatePrompt("Short", 1, 100)).toBeNull();
    });

    it("should reject empty or non-string prompts", () => {
      expect(validatePrompt("")).toBe(
        "Prompt is required and must be a string"
      );
      expect(validatePrompt(null as any)).toBe(
        "Prompt is required and must be a string"
      );
      expect(validatePrompt(undefined as any)).toBe(
        "Prompt is required and must be a string"
      );
      expect(validatePrompt(123 as any)).toBe(
        "Prompt is required and must be a string"
      );
    });

    it("should enforce minimum length", () => {
      expect(validatePrompt("ab", 3)).toBe(
        "prompt must be at least 3 characters"
      );
      expect(validatePrompt("", 1)).toBe(
        "Prompt is required and must be a string"
      );
    });

    it("should enforce maximum length", () => {
      const longPrompt = "A".repeat(1001);
      expect(validatePrompt(longPrompt, 1, 1000)).toBe(
        "Prompt must not exceed 1000 characters"
      );
      expect(validatePrompt("toolong", 1, 5)).toBe(
        "Prompt must not exceed 5 characters"
      );
    });

    it("should work with custom min/max lengths", () => {
      expect(validatePrompt("hello", 10, 20)).toBe(
        "prompt must be at least 10 characters"
      );
      expect(validatePrompt("A".repeat(25), 10, 20)).toBe(
        "Prompt must not exceed 20 characters"
      );
      expect(validatePrompt("A".repeat(15), 10, 20)).toBeNull();
    });
  });

  describe("validateUUID", () => {
    it("should return null for valid UUID v4", () => {
      expect(validateUUID("12345678-1234-4567-8901-123456789abc")).toBeNull();
      expect(validateUUID("87654321-4321-4654-9098-876543210987")).toBeNull();
      expect(validateUUID("99999999-9999-4999-9999-999999999999")).toBeNull();
    });

    it("should reject invalid UUID formats", () => {
      expect(validateUUID("")).toBe("ID is required and must be a string");
      expect(validateUUID("not-a-uuid")).toBe("ID must be a valid UUID v4");
      expect(validateUUID("12345678-1234-1234-1234-123456789012")).toBe(
        "ID must be a valid UUID v4"
      ); // not v4
      expect(validateUUID("12345678123412341234123456789012")).toBe(
        "ID must be a valid UUID v4"
      ); // no dashes
    });

    it("should reject non-string inputs", () => {
      expect(validateUUID(null as any)).toBe(
        "ID is required and must be a string"
      );
      expect(validateUUID(undefined as any)).toBe(
        "ID is required and must be a string"
      );
      expect(validateUUID(123 as any)).toBe(
        "ID is required and must be a string"
      );
    });

    it("should validate UUID v4 format strictly", () => {
      // Test the v4 specific pattern (4 in position 14, 8/9/a/b in position 19)
      expect(validateUUID("12345678-1234-3567-8901-123456789abc")).toBe(
        "ID must be a valid UUID v4"
      ); // wrong version
      expect(validateUUID("12345678-1234-4567-1901-123456789abc")).toBe(
        "ID must be a valid UUID v4"
      ); // wrong variant
    });
  });

  describe("validatePagination", () => {
    it("should return null for valid pagination parameters", () => {
      expect(validatePagination()).toBeNull(); // defaults
      expect(validatePagination(10, 0)).toBeNull();
      expect(validatePagination(50, 100)).toBeNull();
      expect(validatePagination(1, 0)).toBeNull();
    });

    it("should enforce minimum limit", () => {
      expect(validatePagination(0)).toBe(
        "Limit must be a number between 1 and 50"
      );
      expect(validatePagination(-1)).toBe(
        "Limit must be a number between 1 and 50"
      );
    });

    it("should enforce maximum limit", () => {
      expect(validatePagination(51)).toBe(
        "Limit must be a number between 1 and 50"
      );
      expect(validatePagination(1000)).toBe(
        "Limit must be a number between 1 and 50"
      );
    });

    it("should enforce minimum offset", () => {
      expect(validatePagination(10, -1)).toBe("Offset must be a number >= 0");
      expect(validatePagination(10, -100)).toBe("Offset must be a number >= 0");
    });

    it("should handle undefined values gracefully", () => {
      expect(validatePagination(undefined, 0)).toBeNull();
      expect(validatePagination(10, undefined)).toBeNull();
      expect(validatePagination(undefined, undefined)).toBeNull();
    });

    it("should reject non-numeric values", () => {
      expect(validatePagination("10" as any)).toBe(
        "Limit must be a number between 1 and 50"
      );
      expect(validatePagination(10, "0" as any)).toBe(
        "Offset must be a number >= 0"
      );
      expect(validatePagination(null as any)).toBe(
        "Limit must be a number between 1 and 50"
      );
    });
  });
});
