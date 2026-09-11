export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
  durationMs?: number;
  reasoning?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  agentId?: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  error?: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  role?: string;
  avatar: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  updatedAt: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'genai' | 'tool' | 'sandbox' | 'system';
  message: string;
  metadata?: Record<string, any>;
}

export interface SandboxExecutionRequest {
  tool: 'execute_code' | 'file_writer' | 'web_search' | 'fetch_url';
  args: Record<string, any>;
}

export interface SandboxExecutionResponse {
  success: boolean;
  result?: any;
  output?: string;
  error?: string;
  durationMs: number;
  logs?: string[];
  fileUpdated?: WorkspaceFile;
}

export interface SystemSettings {
  apiKey?: string;
  provider: 'gemini' | 'openai-compatible' | 'local';
  defaultModel: string;
  autoExecuteTools: boolean;
  localEndpoint?: string;
}

// Runtime symbols for declaration merging to prevent Node runtime import errors
export const ToolCall = {};
export const ChatMessage = {};
export const AgentPersona = {};
export const WorkspaceFile = {};
export const ExecutionLog = {};
export const SandboxExecutionRequest = {};
export const SandboxExecutionResponse = {};
export const SystemSettings = {};
