import React from 'react';
import { AgentPersona } from '../types/index.ts';
import {
  Bot,
  Plus,
  Settings,
  Sliders,
  Trash2,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  agents: AgentPersona[];
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onOpenCreateAgent: () => void;
  onOpenEditAgent: (agent: AgentPersona) => void;
  onDeleteAgent: (agentId: string) => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
  activeProvider: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
  onOpenCreateAgent,
  onOpenEditAgent,
  onDeleteAgent,
  onOpenSettings,
  onClearChat,
  activeProvider,
}) => {
  return (
    <aside className="w-72 flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 select-none">
      {/* App Header */}
      <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 shadow-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              Agent Harness
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800/50 text-emerald-400">
                MVP
              </span>
            </h1>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Local-first • {activeProvider}
            </div>
          </div>
        </div>
      </div>

      {/* Bot Roster Section */}
      <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-zinc-400" />
          Agent Personas ({agents.length})
        </div>
        <button
          id="create-agent-btn"
          type="button"
          onClick={onOpenCreateAgent}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
          title="Add a new custom agent persona"
        >
          <Plus className="w-3 h-3 text-emerald-400" />
          New
        </button>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {agents.map((agent) => {
          const isActive = agent.id === activeAgentId;
          return (
            <div
              key={agent.id}
              className={`group relative rounded-lg transition-all border ${
                isActive
                  ? 'bg-zinc-900/90 border-emerald-800/60 shadow-xs'
                  : 'hover:bg-zinc-900/50 border-transparent hover:border-zinc-800/60'
              }`}
            >
              <button
                type="button"
                id={`agent-item-${agent.id}`}
                onClick={() => onSelectAgent(agent.id)}
                className="w-full text-left p-2.5 flex items-start gap-2.5"
              >
                <span className="text-xl shrink-0 mt-0.5">{agent.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-zinc-100' : 'text-zinc-300'
                      }`}
                    >
                      {agent.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">{agent.role}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {agent.model}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      T:{agent.temperature}
                    </span>
                  </div>
                </div>
              </button>

              {/* Hover actions: Edit & Delete */}
              <div className="absolute right-2 top-2.5 hidden group-hover:flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded border border-zinc-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditAgent(agent);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  title="Edit agent persona"
                >
                  <Sliders className="w-3 h-3" />
                </button>
                {agents.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAgent(agent.id);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                    title="Delete persona"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Harness Information Box */}
      <div className="p-3 mx-2 mb-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-zinc-300 font-medium font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Sandbox Runtime</span>
        </div>
        <div className="text-zinc-500 text-[10px] leading-relaxed">
          Executes code, manages virtual files, and routes calls through model-agnostic adapters.
        </div>
      </div>

      {/* Footer System Controls */}
      <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-950 space-y-1">
        <button
          id="open-settings-btn"
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            System Settings
          </span>
          <span className="text-[10px] font-mono text-zinc-500">{activeProvider}</span>
        </button>

        <button
          id="clear-chat-btn"
          type="button"
          onClick={onClearChat}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-rose-300 hover:bg-zinc-900/80 transition-colors"
          title="Clear current agent thread"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
          Clear Conversation
        </button>
      </div>
    </aside>
  );
};
