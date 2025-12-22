import { describe, test, expect, vi } from "vitest";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import {
  resolveLibrary,
  getLibraryDocs,
  Context7Agent,
  SYSTEM_PROMPT,
  AGENT_PROMPT,
  RESOLVE_LIBRARY_DESCRIPTION,
} from "./index";

// Create a mock model that satisfies LanguageModel interface (V2 for AI SDK 5)
const createMockModel = () => {
  return {
    specificationVersion: 'v2',
    provider: 'mock',
    modelId: 'mock-model',
    defaultObjectGenerationMode: 'json',
    doGenerate: vi.fn(),
    doStream: vi.fn(),
  } as any;
};

const mockModel = createMockModel();

describe("@toxicoder/context7-tools-ai-sdk", () => {
  describe("Tool structure", () => {
    test("resolveLibrary() should return a tool object with correct structure", () => {
      const tool = resolveLibrary();

      expect(tool).toBeDefined();
      expect(tool).toHaveProperty("execute");
      expect(tool).toHaveProperty("inputSchema");
      expect(tool).toHaveProperty("description");
      expect(tool.description).toContain("library");
    });

    test("getLibraryDocs() should return a tool object with correct structure", () => {
      const tool = getLibraryDocs();

      expect(tool).toBeDefined();
      expect(tool).toHaveProperty("execute");
      expect(tool).toHaveProperty("inputSchema");
      expect(tool).toHaveProperty("description");
      expect(tool.description).toContain("documentation");
    });

    test("tools should accept custom config", () => {
      const resolveTool = resolveLibrary({
        apiKey: "ctx7sk-test-key",
      });

      const docsTool = getLibraryDocs({
        apiKey: "ctx7sk-test-key",
        defaultMaxResults: 5,
      });

      expect(resolveTool).toHaveProperty("execute");
      expect(docsTool).toHaveProperty("execute");
    });
  });

  describe("Tool usage with generateText", () => {
    test("resolveLibrary tool should be called when searching for a library", async () => {
      (mockModel.doGenerate as any).mockResolvedValue({
        content: [{
            type: 'tool-call',
            toolCallId: 'call_1',
            toolName: "resolveLibrary",
            args: {}
        }],
        finishReason: 'tool-calls',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [],
      });

      const result = await generateText({
        model: mockModel,
        tools: {
          resolveLibrary: resolveLibrary(),
        },
        prompt: "Search for 'react' library",
      });

      expect(result.toolCalls.length).toBeGreaterThan(0);
      expect(result.toolCalls[0].toolName).toBe("resolveLibrary");
    });

    test("getLibraryDocs tool should fetch documentation", async () => {
      (mockModel.doGenerate as any).mockResolvedValue({
        content: [{
            type: 'tool-call',
            toolCallId: 'call_2',
            toolName: "getLibraryDocs",
            args: {}
        }],
        finishReason: 'tool-calls',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [],
      });

      const result = await generateText({
        model: mockModel,
        tools: {
          getLibraryDocs: getLibraryDocs(),
        },
        prompt: "Fetch documentation for library ID '/facebook/react'",
      });

      expect(result.toolCalls.length).toBeGreaterThan(0);
      expect(result.toolCalls[0].toolName).toBe("getLibraryDocs");
    });
  });

  describe("Context7Agent class", () => {
    test("should create an agent instance with model", () => {
      const agent = new Context7Agent({
        model: mockModel,
      });

      expect(agent).toBeDefined();
      expect(agent).toHaveProperty("generate");
    });

    test("should accept custom stopWhen condition", () => {
      const agent = new Context7Agent({
        model: mockModel,
        stopWhen: stepCountIs(3),
      });

      expect(agent).toBeDefined();
    });

    test("should accept custom system prompt", () => {
      const agent = new Context7Agent({
        model: mockModel,
        system: "Custom system prompt for testing",
      });

      expect(agent).toBeDefined();
    });

    test("should accept Context7 config options", () => {
      const agent = new Context7Agent({
        model: mockModel,
        apiKey: "ctx7sk-test-key",
        defaultMaxResults: 5,
      });

      expect(agent).toBeDefined();
    });

    test("should accept additional tools alongside Context7 tools", () => {
      const customTool = tool({
        description: "A custom test tool",
        inputSchema: z.object({
          input: z.string().describe("Test input"),
        }),
        execute: async ({ input }) => ({ result: `processed: ${input}` }),
      });

      const agent = new Context7Agent({
        model: mockModel,
        tools: {
          customTool,
        },
      });

      expect(agent).toBeDefined();
    });

    test("should generate response using agent workflow", async () => {
       (mockModel.doGenerate as any).mockResolvedValue({
        content: [{
            type: 'tool-call',
            toolCallId: 'call_3',
            toolName: "resolveLibrary",
            args: {}
        }],
        finishReason: 'tool-calls',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [],
      });

      const agent = new Context7Agent({
        model: mockModel,
      });

      const result = await agent.generate({
        prompt: "Find the React library and get documentation about hooks",
      });

      expect(result).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);

      const allToolCalls = result.steps.flatMap((step) => step.toolCalls);
      const toolNames = allToolCalls.map((call) => call.toolName);
      expect(toolNames).toContain("resolveLibrary");
    });

    test("should include Context7 tools in generate result", async () => {
      // First step: resolveLibrary
      (mockModel.doGenerate as any)
        .mockResolvedValueOnce({
            content: [{
                type: 'tool-call',
                toolCallId: 'call_4',
                toolName: "resolveLibrary",
                args: {}
            }],
            finishReason: 'tool-calls',
            usage: { promptTokens: 0, completionTokens: 0 },
            rawCall: { rawPrompt: null, rawSettings: {} },
            warnings: [],
        })
        // Second step: getLibraryDocs
        .mockResolvedValueOnce({
            content: [{
                type: 'tool-call',
                toolCallId: 'call_5',
                toolName: "getLibraryDocs",
                args: {}
            }],
            finishReason: 'tool-calls',
            usage: { promptTokens: 0, completionTokens: 0 },
            rawCall: { rawPrompt: null, rawSettings: {} },
            warnings: [],
        })
         // Third step: finish
        .mockResolvedValueOnce({
            content: [{ type: 'text', text: "Done" }],
            finishReason: 'stop',
            usage: { promptTokens: 0, completionTokens: 0 },
            rawCall: { rawPrompt: null, rawSettings: {} },
            warnings: [],
        });

      const agent = new Context7Agent({
        model: mockModel,
        stopWhen: stepCountIs(5),
      });

      const result = await agent.generate({
        prompt: "Use resolveLibrary then getLibraryDocs",
      });

      expect(result).toBeDefined();

      const allToolCalls = result.steps.flatMap((step) => step.toolCalls);
      const toolNames = allToolCalls.map((call) => call.toolName);

      expect(toolNames).toContain("resolveLibrary");
      expect(toolNames).toContain("getLibraryDocs");
    });
  });

  describe("Prompt exports", () => {
    test("should export SYSTEM_PROMPT", () => {
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(typeof SYSTEM_PROMPT).toBe("string");
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    test("should export AGENT_PROMPT", () => {
      expect(AGENT_PROMPT).toBeDefined();
      expect(typeof AGENT_PROMPT).toBe("string");
      expect(AGENT_PROMPT).toContain("Context7");
    });

    test("should export RESOLVE_LIBRARY_DESCRIPTION", () => {
      expect(RESOLVE_LIBRARY_DESCRIPTION).toBeDefined();
      expect(typeof RESOLVE_LIBRARY_DESCRIPTION).toBe("string");
      expect(RESOLVE_LIBRARY_DESCRIPTION).toContain("library");
    });
  });
});
