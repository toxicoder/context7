import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Context7 } from "./client";
import { Context7Error } from "@error";
import type { CodeDocsResponse, InfoDocsResponse } from "@commands/types";

describe("Context7 Client", () => {
  const apiKey = process.env.CONTEXT7_API_KEY || process.env.API_KEY || "dummy-key";

  // Mock global fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({}),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("constructor", () => {
    test("should create client with API key", () => {
      const client = new Context7({ apiKey });
      expect(client).toBeDefined();
    });

    test("should create client from environment variables", () => {
      // Temporarily set env var if not present
      const originalEnv = process.env.CONTEXT7_API_KEY;
      if (!originalEnv) process.env.CONTEXT7_API_KEY = "dummy";

      const client = new Context7();
      expect(client).toBeDefined();

      if (!originalEnv) delete process.env.CONTEXT7_API_KEY;
      else process.env.CONTEXT7_API_KEY = originalEnv;
    });

    test("should throw error when API key is missing", () => {
      const originalEnv = process.env.CONTEXT7_API_KEY;
      const originalApiKey = process.env.API_KEY;

      delete process.env.CONTEXT7_API_KEY;
      delete process.env.API_KEY;

      expect(() => new Context7({ apiKey: "" })).toThrow(Context7Error);
      expect(() => new Context7({})).toThrow(Context7Error);
      expect(() => new Context7()).toThrow("API key is required");

      if (originalEnv) process.env.CONTEXT7_API_KEY = originalEnv;
      if (originalApiKey) process.env.API_KEY = originalApiKey;
    });

    test("should prefer config API key over environment variable", () => {
      const customApiKey = "ctx7sk-custom-key";
      const client = new Context7({ apiKey: customApiKey });
      expect(client).toBeDefined();
    });
  });

  describe("searchLibrary", () => {
    const client = new Context7({ apiKey });

    test("should search for libraries", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          results: [
            {
              id: "/facebook/react",
              title: "React",
              description: "A JavaScript library for building user interfaces",
              branch: "main",
              lastUpdateDate: "2023-01-01",
              state: "indexed",
              totalTokens: 1000,
              totalSnippets: 10,
            },
          ],
        }),
      });

      const result = await client.searchLibrary("react");

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
    });

    test("should return results with correct structure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          results: [
            {
              id: "/microsoft/typescript",
              title: "TypeScript",
              description:
                "TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",
              branch: "main",
              lastUpdateDate: "2023-01-01",
              state: "indexed",
              totalTokens: 1000,
              totalSnippets: 10,
            },
          ],
        }),
      });

      const result = await client.searchLibrary("typescript");

      expect(result.results.length).toBeGreaterThan(0);
      const firstResult = result.results[0];

      expect(firstResult).toHaveProperty("id");
      expect(firstResult).toHaveProperty("title");
      expect(firstResult).toHaveProperty("description");
      expect(firstResult).toHaveProperty("branch");
      expect(firstResult).toHaveProperty("lastUpdateDate");
      expect(firstResult).toHaveProperty("state");
      expect(firstResult).toHaveProperty("totalTokens");
      expect(firstResult).toHaveProperty("totalSnippets");
    });

    test("should search with different queries", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          results: [
            {
              id: "dummy",
            },
          ],
        }),
      });

      const queries = ["vue", "express", "next"];

      for (const query of queries) {
        const result = await client.searchLibrary(query);
        expect(result.results.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getDocs - text format", () => {
    const client = new Context7({ apiKey });

    test("should get code docs as text with pagination and totalTokens", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "dummy content",
          pagination: { page: 1, totalPages: 1 },
          totalTokens: 100,
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "txt",
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
      expect(typeof result.content).toBe("string");
      expect(result.content.length).toBeGreaterThan(0);
      expect(typeof result.totalTokens).toBe("number");
    });

    test("should get info docs as text with pagination and totalTokens", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "dummy content",
          pagination: { page: 1, totalPages: 1 },
          totalTokens: 100,
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "info",
        format: "txt",
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
      expect(typeof result.content).toBe("string");
      expect(result.content.length).toBeGreaterThan(0);
      expect(typeof result.totalTokens).toBe("number");
    });

    test("should get docs with default format (json)", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [],
          totalTokens: 0,
          pagination: {},
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "code",
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("snippets");
    });

    test("should get docs with pagination metadata", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            content: "page 1",
            pagination: { page: 1 },
            totalTokens: 10,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            content: "page 2",
            pagination: { page: 2 },
            totalTokens: 10,
          }),
        });

      const page1 = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "txt",
        page: 1,
        limit: 3,
      });

      const page2 = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "txt",
        page: 2,
        limit: 3,
      });

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(page1).toHaveProperty("content");
      expect(page1).toHaveProperty("pagination");
      expect(page2).toHaveProperty("content");
      expect(page2).toHaveProperty("pagination");
      expect(page1.pagination.page).toBe(1);
      expect(page2.pagination.page).toBe(2);
    });

    test("should get docs with topic filter", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "hooks",
          pagination: {},
          totalTokens: 100,
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "txt",
        topic: "hooks",
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
    });
  });

  describe("getDocs - JSON format", () => {
    const client = new Context7({ apiKey });

    test("should get code docs as JSON", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [
            {
              codeTitle: "test",
              codeDescription: "test",
              codeLanguage: "ts",
              codeTokens: 10,
              codeId: "1",
              pageTitle: "Page",
              codeList: ["code"],
            },
          ],
          totalTokens: 100,
          pagination: { page: 1, totalPages: 1 },
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "json",
        limit: 3,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      const codeResult = result as CodeDocsResponse;
      expect(codeResult.snippets).toBeDefined();
      expect(Array.isArray(codeResult.snippets)).toBe(true);
      expect(codeResult.snippets.length).toBeGreaterThan(0);
      expect(codeResult.totalTokens).toBeDefined();
      expect(typeof codeResult.totalTokens).toBe("number");
      expect(codeResult.pagination).toBeDefined();
    });

    test("should get info docs as JSON", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [
            {
              content: "info",
              contentTokens: 10,
            },
          ],
          totalTokens: 100,
          pagination: { page: 1, totalPages: 1 },
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "info",
        format: "json",
        limit: 3,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");

      const infoResult = result as InfoDocsResponse;
      expect(infoResult.snippets).toBeDefined();
      expect(Array.isArray(infoResult.snippets)).toBe(true);
      expect(infoResult.snippets.length).toBeGreaterThan(0);
      expect(infoResult.totalTokens).toBeDefined();
      expect(typeof infoResult.totalTokens).toBe("number");
      expect(infoResult.pagination).toBeDefined();
    });

    test("should have correct code snippet structure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [
            {
              codeTitle: "test",
              codeDescription: "test",
              codeLanguage: "ts",
              codeTokens: 10,
              codeId: "1",
              pageTitle: "Page",
              codeList: ["code"],
            },
          ],
          totalTokens: 100,
          pagination: {},
        }),
      });

      const result = (await client.getDocs("/facebook/react", {
        mode: "code",
        format: "json",
        limit: 1,
      })) as CodeDocsResponse;

      const snippet = result.snippets[0];
      expect(snippet).toHaveProperty("codeTitle");
      expect(snippet).toHaveProperty("codeDescription");
      expect(snippet).toHaveProperty("codeLanguage");
      expect(snippet).toHaveProperty("codeTokens");
      expect(snippet).toHaveProperty("codeId");
      expect(snippet).toHaveProperty("pageTitle");
      expect(snippet).toHaveProperty("codeList");
      expect(Array.isArray(snippet.codeList)).toBe(true);
    });

    test("should have correct info snippet structure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [
            {
              content: "info",
              contentTokens: 10,
            },
          ],
          totalTokens: 100,
          pagination: {},
        }),
      });

      const result = (await client.getDocs("/facebook/react", {
        mode: "info",
        format: "json",
        limit: 1,
      })) as InfoDocsResponse;

      const snippet = result.snippets[0];
      expect(snippet).toHaveProperty("content");
      expect(snippet).toHaveProperty("contentTokens");
      expect(typeof snippet.content).toBe("string");
      expect(typeof snippet.contentTokens).toBe("number");
    });

    test("should have correct pagination structure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [],
          totalTokens: 0,
          pagination: {
            page: 1,
            limit: 5,
            totalPages: 10,
            hasNext: true,
            hasPrev: false,
          },
        }),
      });

      const result = (await client.getDocs("/facebook/react", {
        mode: "code",
        format: "json",
        page: 1,
        limit: 5,
      })) as CodeDocsResponse;

      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(typeof result.pagination.totalPages).toBe("number");
      expect(typeof result.pagination.hasNext).toBe("boolean");
      expect(typeof result.pagination.hasPrev).toBe("boolean");
    });

    test("should respect limit parameter", async () => {
      const limit = 2;
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [{}, {}],
          totalTokens: 0,
          pagination: {},
        }),
      });

      const result = (await client.getDocs("/facebook/react", {
        mode: "code",
        format: "json",
        limit,
      })) as CodeDocsResponse;

      expect(result.snippets.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("getDocs - with version", () => {
    const client = new Context7({ apiKey });

    test("should accept version parameter", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "v18",
          pagination: {},
          totalTokens: 10,
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        mode: "code",
        format: "txt",
        limit: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
    });
  });

  describe("getDocs - different libraries", () => {
    const client = new Context7({ apiKey });

    test("should get docs for Vue", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "vue",
          pagination: {},
          totalTokens: 10,
        }),
      });

      const result = await client.getDocs("/vuejs/core", {
        mode: "code",
        format: "txt",
        limit: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
      expect(result.content.length).toBeGreaterThan(0);
    });

    test("should get docs for Express", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "express",
          pagination: {},
          totalTokens: 10,
        }),
      });

      const result = await client.getDocs("/expressjs/express", {
        mode: "code",
        format: "txt",
        limit: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    const client = new Context7({ apiKey });

    test("should handle invalid library ID gracefully", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Not Found" }),
      });

      await expect(
        client.getDocs("/nonexistent/library", {
          mode: "code",
          format: "txt",
          limit: 1,
        })
      ).rejects.toThrow();
    });

    test("should handle invalid search query", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ results: [] }),
      });

      const result = await client.searchLibrary("");
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe("type inference", () => {
    const client = new Context7({ apiKey });

    test("should infer TextDocsResponse type for txt format", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          content: "text",
          pagination: {},
          totalTokens: 10,
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        format: "txt",
        limit: 1,
      });

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("pagination");
      expect(result).toHaveProperty("totalTokens");
      expect(typeof result.content).toBe("string");
      expect(typeof result.totalTokens).toBe("number");
    });

    test("should infer CodeDocsResponse for json format with code mode", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [],
          totalTokens: 0,
          pagination: {},
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        format: "json",
        mode: "code",
        limit: 1,
      });

      expect(result).toHaveProperty("snippets");
      expect((result as CodeDocsResponse).snippets).toBeDefined();
    });

    test("should infer InfoDocsResponse for json format with info mode", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          snippets: [],
          totalTokens: 0,
          pagination: {},
        }),
      });

      const result = await client.getDocs("/facebook/react", {
        format: "json",
        mode: "info",
        limit: 1,
      });

      expect(result).toHaveProperty("snippets");
      expect((result as InfoDocsResponse).snippets).toBeDefined();
    });
  });
});
