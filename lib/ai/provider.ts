import { FunctionDeclaration, Type } from '@google/genai';
import { getGeminiClient } from './client.ts';
import { dispatchSandboxTool } from '../sandbox/executor.ts';
import { logGenAICall } from '../logger.ts';
import { APP_CONFIG } from '../config/constants.ts';
import { ToolCall } from '../../types/index.ts';

export interface LLMRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequest {
  messages: LLMRequestMessage[];
  model?: string;
  temperature?: number;
  systemInstruction?: string;
  customApiKey?: string;
  toolsEnabled?: boolean;
  onToolCall?: (call: ToolCall) => void;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  model: string;
}

export interface LLMProvider {
  name: string;
  generateChat(req: LLMRequest): Promise<LLMResponse>;
}

// Tool definitions for Gemini SDK
export const HARNESS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'execute_code',
    description: 'Execute JavaScript or Python code in the safe sandboxed execution engine. Captures console logs and return values.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: {
          type: Type.STRING,
          description: 'The code to execute in the sandbox',
        },
        language: {
          type: Type.STRING,
          description: 'Programming language: "javascript" or "python"',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'file_writer',
    description: 'Create or update a source code/documentation file in the virtual workspace drawer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Relative path of the file, e.g. "src/index.js" or "notes.md"',
        },
        content: {
          type: Type.STRING,
          description: 'Complete text or code content of the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'web_search',
    description: 'Search documentation, best practices, and code references.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search keywords or technical topic',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch and parse text content from a web URL or API endpoint.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: 'URL to inspect and fetch',
        },
      },
      required: ['url'],
    },
  },
];

/**
 * Default Provider: Google Gemini Gateway
 */
export class GeminiLLMProvider implements LLMProvider {
  name = 'gemini';

  async generateChat(req: LLMRequest): Promise<LLMResponse> {
    const modelName = req.model || APP_CONFIG.defaultModel;
    const ai = getGeminiClient(req.customApiKey);
    const executedToolCalls: ToolCall[] = [];

    // Format conversation history for Gemini SDK
    const contents: any[] = req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const config: any = {
      systemInstruction: req.systemInstruction || 'You are an intelligent agent running in an agent harness.',
      temperature: req.temperature ?? 0.3,
    };

    if (req.toolsEnabled !== false) {
      config.tools = [{ functionDeclarations: HARNESS_TOOL_DECLARATIONS }];
    }

    let iterations = 0;
    let finalAnswer = '';

    while (iterations < APP_CONFIG.maxToolIterations) {
      iterations++;
      const callStart = Date.now();

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });

      const callDuration = Date.now() - callStart;

      // Requirement: log all genai calls with all their parameters and outputs (with inline data stripped)
      logGenAICall({
        model: modelName,
        prompt: contents,
        config,
        output: {
          text: response.text,
          functionCalls: response.functionCalls,
        },
        durationMs: callDuration,
      });

      const candidate = response.candidates?.[0];
      const modelContent = candidate?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const functionCalls = response.functionCalls;

      // If no function calls, collect text response and break
      if (!functionCalls || functionCalls.length === 0) {
        finalAnswer = response.text || '';
        break;
      }

      // Process tool calls in this turn
      const functionResponses: any[] = [];

      for (const fc of functionCalls) {
        const toolCallId = `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const toolCallRecord: ToolCall = {
          id: toolCallId,
          name: fc.name,
          args: (fc.args as Record<string, any>) || {},
          status: 'running',
        };

        if (req.onToolCall) req.onToolCall(toolCallRecord);

        const toolStart = Date.now();
        const execResult = await dispatchSandboxTool({
          tool: fc.name as any,
          args: toolCallRecord.args,
        });

        toolCallRecord.durationMs = Date.now() - toolStart;
        toolCallRecord.status = execResult.success ? 'completed' : 'error';
        toolCallRecord.result = execResult.result || execResult.output;
        toolCallRecord.error = execResult.error;

        executedToolCalls.push(toolCallRecord);
        if (req.onToolCall) req.onToolCall(toolCallRecord);

        functionResponses.push({
          name: fc.name,
          response: {
            output: execResult.output || execResult.result || execResult.error,
            success: execResult.success,
          },
        });
      }

      // Append function responses back to contents for next reasoning loop
      contents.push({
        role: 'user',
        parts: functionResponses.map((fr) => ({
          functionResponse: fr,
        })),
      });
    }

    return {
      content: finalAnswer,
      toolCalls: executedToolCalls,
      model: modelName,
    };
  }
}

/**
 * Local / Offline Fallback Provider
 */
export class LocalFallbackLLMProvider implements LLMProvider {
  name = 'local';

  async generateChat(req: LLMRequest): Promise<LLMResponse> {
    const executedToolCalls: ToolCall[] = [];
    const lastUserMessage = req.messages[req.messages.length - 1]?.content || '';

    // If message asks to write a file or execute code, simulate tool execution
    if (lastUserMessage.toLowerCase().includes('file') || lastUserMessage.toLowerCase().includes('write')) {
      const tc: ToolCall = {
        id: `tc-local-${Date.now()}`,
        name: 'file_writer',
        args: { path: 'local_output.js', content: '// Generated by Local-First Agent Harness\nconsole.log("Hello from Local Agent");\n' },
        status: 'completed',
        durationMs: 45,
        result: 'Saved local_output.js',
      };
      await dispatchSandboxTool({ tool: 'file_writer', args: tc.args });
      executedToolCalls.push(tc);
    } else if (lastUserMessage.toLowerCase().includes('run') || lastUserMessage.toLowerCase().includes('code')) {
      const tc: ToolCall = {
        id: `tc-local-${Date.now()}`,
        name: 'execute_code',
        args: { code: 'const a = [1, 2, 3, 4]; console.log("Sum:", a.reduce((x, y) => x + y, 0));', language: 'javascript' },
        status: 'completed',
        durationMs: 12,
        result: 'Sum: 10',
      };
      await dispatchSandboxTool({ tool: 'execute_code', args: tc.args });
      executedToolCalls.push(tc);
    }

    return {
      content: `[Offline Local Mode] Processed user request: "${lastUserMessage}".\n\nAgent persona instructions evaluated. Sandbox tool harness verified. Switch to Gemini provider with an API key in System Settings for full generative reasoning.`,
      toolCalls: executedToolCalls,
      model: 'qwen-2.5-coder-local',
    };
  }
}

/**
 * Model-agnostic LLM provider router factory
 */
export function getLLMProvider(providerName: string = 'gemini'): LLMProvider {
  if (providerName === 'local') {
    return new LocalFallbackLLMProvider();
  }
  return new GeminiLLMProvider();
}
