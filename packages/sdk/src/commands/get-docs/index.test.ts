import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { GetDocsCommand } from "./index";
import { newHttpClient } from "../../utils/test-utils";
import { Context7 } from "../../client";
import { CodeDocsResponse, TextDocsResponse } from "@commands/types";

// Mock global fetch
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({
      content: "dummy content",
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      totalTokens: 100,
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
    }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

const httpClient = newHttpClient();

describe("GetDocsCommand", () => {
  test("should get library code docs as text with pagination and totalTokens", async () => {
    const command = new GetDocsCommand("/facebook/react", {
      mode: "code",
      format: "txt",
      limit: 10,
    });
    const result = await command.exec(httpClient);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("pagination");
    expect(result).toHaveProperty("totalTokens");
    expect(typeof (result as TextDocsResponse).content).toBe("string");
    expect((result as TextDocsResponse).content.length).toBeGreaterThan(0);
    expect((result as TextDocsResponse).pagination).toHaveProperty("page");
    expect((result as TextDocsResponse).pagination).toHaveProperty("limit");
    expect((result as TextDocsResponse).pagination).toHaveProperty("totalPages");
    expect((result as TextDocsResponse).pagination).toHaveProperty("hasNext");
    expect((result as TextDocsResponse).pagination).toHaveProperty("hasPrev");
    expect(typeof (result as TextDocsResponse).totalTokens).toBe("number");
  });

  test("should get library info docs as text with pagination and totalTokens", async () => {
    const command = new GetDocsCommand("/facebook/react", {
      mode: "info",
      format: "txt",
      limit: 10,
    });
    const result = await command.exec(httpClient);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("pagination");
    expect(result).toHaveProperty("totalTokens");
    expect(typeof (result as TextDocsResponse).content).toBe("string");
    expect((result as TextDocsResponse).content.length).toBeGreaterThan(0);
    expect(typeof (result as TextDocsResponse).totalTokens).toBe("number");
  });

  test("should get library code docs as JSON", async () => {
    const command = new GetDocsCommand("/facebook/react", {
      mode: "code",
      format: "json",
      limit: 5,
    });
    const result = await command.exec(httpClient);

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("snippets");
    expect(Array.isArray((result as CodeDocsResponse).snippets)).toBe(true);
    expect(result).toHaveProperty("pagination");
  });

  test("should get library code docs using client with pagination and totalTokens", async () => {
    const client = new Context7({
      apiKey: process.env.CONTEXT7_API_KEY || process.env.API_KEY || "dummy-key",
    });

    const result = await client.getDocs("/facebook/react", {
      mode: "code",
      format: "txt",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("pagination");
    expect(result).toHaveProperty("totalTokens");
    expect(result.content.length).toBeGreaterThan(0);
    expect(typeof result.totalTokens).toBe("number");
  });

  test("should get library info docs using client with pagination and totalTokens", async () => {
    const client = new Context7({
      apiKey: process.env.CONTEXT7_API_KEY || process.env.API_KEY || "dummy-key",
    });

    const result = await client.getDocs("/facebook/react", {
      mode: "info",
      format: "txt",
      limit: 10,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("pagination");
    expect(result).toHaveProperty("totalTokens");
    expect(result.content.length).toBeGreaterThan(0);
    expect(typeof result.totalTokens).toBe("number");
  });
});
