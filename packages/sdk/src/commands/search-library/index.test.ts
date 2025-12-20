import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchLibraryCommand } from "./index";
import { newHttpClient } from "../../utils/test-utils";
import { Context7 } from "../../client";

// Mock global fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
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
});

afterEach(() => {
  global.fetch = originalFetch;
});

const httpClient = newHttpClient();

describe("SearchLibraryCommand", () => {
  test("should search for a library", async () => {
    const command = new SearchLibraryCommand("react");
    const result = await command.exec(httpClient);

    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
  });

  test("should search for a library using client", async () => {
    const client = new Context7({
      apiKey: process.env.CONTEXT7_API_KEY || process.env.API_KEY || "dummy-key",
    });

    const result = await client.searchLibrary("react");

    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
  });
});
