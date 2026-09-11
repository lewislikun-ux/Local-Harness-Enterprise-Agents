import { AgentPersona, ChatMessage, SystemSettings, WorkspaceFile } from '../types/index.ts';
import { DEFAULT_AGENTS, APP_CONFIG } from './config/constants.ts';

const STORAGE_KEYS = {
  AGENTS: 'agent_harness_roster_v1',
  ACTIVE_AGENT: 'agent_harness_active_agent_v1',
  MESSAGES_PREFIX: 'agent_harness_messages_',
  SETTINGS: 'agent_harness_settings_v1',
  WORKSPACE_FILES: 'agent_harness_files_v1',
};

export const defaultSettings: SystemSettings = {
  provider: 'gemini',
  defaultModel: APP_CONFIG.defaultModel,
  autoExecuteTools: true,
};

export function loadAgents(): AgentPersona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_AGENTS;
}

export function saveAgents(agents: AgentPersona[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  } catch (err) {
    console.error('Failed to save agents to localStorage:', err);
  }
}

export function loadActiveAgentId(agents: AgentPersona[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_AGENT);
    if (saved && agents.some((a) => a.id === saved)) return saved;
  } catch {
    // fallback
  }
  return agents[0]?.id || DEFAULT_AGENTS[0].id;
}

export function saveActiveAgentId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_AGENT, id);
  } catch (err) {
    console.error('Failed to save active agent ID:', err);
  }
}

export function loadMessages(agentId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES_PREFIX + agentId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [
    {
      id: `msg-welcome-${agentId}`,
      role: 'assistant',
      content: `Hello! I am ready to collaborate. I have direct access to the sandbox tool harness (\`execute_code\`, \`file_writer\`, \`web_search\`, \`fetch_url\`). How can I help you build today?`,
      agentId,
      timestamp: Date.now(),
    },
  ];
}

export function saveMessages(agentId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES_PREFIX + agentId, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to localStorage:', err);
  }
}

export function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return defaultSettings;
}

export function saveSettings(settings: SystemSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
