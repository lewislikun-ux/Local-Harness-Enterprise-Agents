// Centralized configuration for all configurable items (models, providers, limits, defaults)

export const APP_CONFIG = {
  appName: 'Local-First Agent Harness',
  version: '1.0.0',
  defaultProvider: 'gemini',
  defaultModel: 'gemini-3.5-flash-lite',
  fallbackModel: 'gemini-3.8-flash',
  maxToolIterations: 6,
  executionTimeoutMs: 10000,
} as const;

export interface ModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai-compatible' | 'local';
  description: string;
  recommendedFor?: string;
  supportsTools: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'gemini-3.5-flash-lite',
    provider: 'gemini',
    description: 'Fast, highly capable default model for general orchestration & tool calling',
    recommendedFor: 'Default Orchestration',
    supportsTools: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Latest high-performance lightweight multimodal reasoning model',
    recommendedFor: 'Reasoning & Coding',
    supportsTools: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    provider: 'gemini',
    description: 'High-capability complex problem-solving & deep code synthesis',
    recommendedFor: 'Deep Architecture',
    supportsTools: true,
  },
  {
    id: 'qwen-2.5-coder-local',
    name: 'Local / Ollama (Qwen 2.5 Coder)',
    provider: 'local',
    description: 'Local-first offline fallback endpoint (simulated / HTTP bridge)',
    recommendedFor: 'Offline Sandboxing',
    supportsTools: true,
  },
];

export const DEFAULT_AGENTS = [
  {
    id: 'agent-architect-alpha',
    name: 'Architect Alpha',
    role: 'System Architect',
    avatar: '🏗️',
    model: 'gemini-3.5-flash-lite',
    temperature: 0.3,
    systemPrompt: `You are Architect Alpha, a Principal Software Architect.
Your goal is to inspect user requests, design clean technical architectures, modular code files, and verify system safety.
You actively utilize available tools (file_writer, execute_code, web_search) to build and verify solutions before returning answers.
Always explain your engineering rationale concisely and create modular code.`,
  },
  {
    id: 'agent-code-monkey',
    name: 'Code-Monkey',
    role: 'Senior Full-Stack Engineer',
    avatar: '🐒',
    model: 'gemini-3.5-flash-lite',
    temperature: 0.2,
    systemPrompt: `You are Code-Monkey, a pragmatic and productive senior full-stack developer.
When asked to write or test code, use 'file_writer' to save source files and 'execute_code' to verify syntax, calculations, or algorithms.
Produce lean, bug-free TypeScript and JavaScript without bloat.`,
  },
  {
    id: 'agent-data-analyst',
    name: 'Data-Analyst',
    role: 'Quantitative Researcher',
    avatar: '📊',
    model: 'gemini-3.5-flash-lite',
    temperature: 0.4,
    systemPrompt: `You are Data-Analyst, specialized in data processing, statistical computing, and web information gathering.
You use 'web_search' or 'fetch_url' to look up data, and 'execute_code' to run calculations or analyze datasets. Format tabular outputs cleanly.`,
  },
];

export const SANDBOX_LIMITS = {
  maxExecutionTimeMs: 5000,
  maxOutputChars: 20000,
  maxFileSizeChars: 500000,
  allowedFileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.py', '.txt', '.html', '.css', '.sql'],
};
