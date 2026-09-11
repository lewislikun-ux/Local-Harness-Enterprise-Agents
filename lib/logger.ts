import { ExecutionLog } from '../types/index.ts';

// Helper to strip inline binary data from logged payloads
export function stripInlineData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => stripInlineData(item));
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'inlineData' || key === 'data' && typeof value === 'string' && value.length > 256) {
      cleaned[key] = `[Binary / Inline Data stripped - ${typeof value === 'string' ? value.length : 0} bytes]`;
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = stripInlineData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// In-memory log buffer for the harness
const logListeners: Array<(log: ExecutionLog) => void> = [];
const internalLogs: ExecutionLog[] = [];
const MAX_LOG_HISTORY = 200;

export function addLogListener(listener: (log: ExecutionLog) => void) {
  logListeners.push(listener);
  return () => {
    const idx = logListeners.indexOf(listener);
    if (idx !== -1) logListeners.splice(idx, 1);
  };
}

export function getInternalLogs(): ExecutionLog[] {
  return [...internalLogs];
}

export function recordLog(log: Omit<ExecutionLog, 'id' | 'timestamp'>): ExecutionLog {
  const fullLog: ExecutionLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  internalLogs.unshift(fullLog);
  if (internalLogs.length > MAX_LOG_HISTORY) {
    internalLogs.pop();
  }

  // Console output for developer visibility
  const prefix = `[${fullLog.category.toUpperCase()}]`;
  if (fullLog.level === 'error') {
    console.error(prefix, fullLog.message, fullLog.metadata ? fullLog.metadata : '');
  } else if (fullLog.level === 'warn') {
    console.warn(prefix, fullLog.message, fullLog.metadata ? fullLog.metadata : '');
  } else {
    console.info(prefix, fullLog.message, fullLog.metadata ? fullLog.metadata : '');
  }

  for (const listener of logListeners) {
    try {
      listener(fullLog);
    } catch {
      // ignore listener errors
    }
  }

  return fullLog;
}

// User Requirement: "log as info all function calls (with their parameters)"
export function logFunctionCall(functionName: string, parameters: Record<string, any>): ExecutionLog {
  const sanitizedParams = stripInlineData(parameters);
  return recordLog({
    level: 'info',
    category: 'tool',
    message: `Invoking tool function: "${functionName}"`,
    metadata: {
      functionName,
      parameters: sanitizedParams,
    },
  });
}

// User Requirement: "log all genai calls with all their parameters (models used, prompt, config) and their outputs, just strip inline data"
export function logGenAICall(params: {
  model: string;
  prompt: any;
  config?: any;
  output?: any;
  durationMs?: number;
}): ExecutionLog {
  const cleanPrompt = stripInlineData(params.prompt);
  const cleanConfig = stripInlineData(params.config || {});
  const cleanOutput = stripInlineData(params.output);

  return recordLog({
    level: 'info',
    category: 'genai',
    message: `GenAI Call completed with model "${params.model}" (${params.durationMs ?? 0}ms)`,
    metadata: {
      model: params.model,
      prompt: cleanPrompt,
      config: cleanConfig,
      output: cleanOutput,
      durationMs: params.durationMs,
    },
  });
}
