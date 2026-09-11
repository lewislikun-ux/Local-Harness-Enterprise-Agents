import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { AgentPersona, ChatMessage } from '../types/index.ts';
import { ToolCallLog } from './ToolCallLog.tsx';
import {
  Send,
  Loader2,
  Sparkles,
  Terminal,
  FileCode,
  Globe,
  Sliders,
  PanelRight,
  Bot,
  User,
  AlertCircle,
} from 'lucide-react';

interface ChatInterfaceProps {
  agent: AgentPersona;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onOpenWorkspace: () => void;
  onViewFile?: (filePath: string) => void;
  isWorkspaceOpen: boolean;
}

const SAMPLE_PROMPTS = [
  {
    icon: <Terminal className="w-3 h-3 text-amber-400" />,
    text: 'Write and test a prime number algorithm in the sandbox using execute_code',
  },
  {
    icon: <FileCode className="w-3 h-3 text-emerald-400" />,
    text: 'Use file_writer to create a modular task runner in src/runner.js',
  },
  {
    icon: <Globe className="w-3 h-3 text-sky-400" />,
    text: 'Search web documentation for Gemini Function Calling best practices',
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agent,
  messages,
  onSendMessage,
  isLoading,
  onOpenWorkspace,
  onViewFile,
  isWorkspaceOpen,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-200 min-w-0">
      {/* Active Agent Navigation Bar */}
      <header className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{agent.avatar}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100 truncate">
                {agent.name}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-300 shrink-0">
                {agent.model}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {agent.role || 'Harness Agent'} • Temp: {agent.temperature}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="toggle-workspace-btn"
            type="button"
            onClick={onOpenWorkspace}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isWorkspaceOpen
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle virtual workspace drawer"
          >
            <PanelRight className="w-3.5 h-3.5" />
            Workspace
          </button>
        </div>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length <= 1 && (
          <div className="my-6 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-2xl">
              {agent.avatar}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Connected to {agent.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Equipped with sandboxed tool calling: safe code execution, virtual file writer, and web discovery.
              </p>
            </div>

            {/* Quick Prompt Starters */}
            <div className="pt-2 text-left space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Quick harness tasks
              </div>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(sample.text);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 text-left text-xs text-zinc-300 transition-colors"
                  >
                    <span className="p-1 rounded bg-zinc-950 border border-zinc-800/80 shrink-0">
                      {sample.icon}
                    </span>
                    <span className="truncate">{sample.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Items */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-sm mt-0.5">
                  {agent.avatar}
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                  isUser
                    ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60'
                    : 'bg-zinc-900/60 text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {/* Header for agent message */}
                {!isUser && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b border-zinc-800/60 font-sans">
                    <span className="font-semibold text-zinc-300">{agent.name}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                )}

                {/* Collapsible Tool Call Visualizers */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 my-1">
                    <div className="text-[10px] font-mono text-zinc-400 font-medium">
                      Tool Executions ({msg.toolCalls.length}):
                    </div>
                    {msg.toolCalls.map((tc) => (
                      <ToolCallLog
                        key={tc.id}
                        toolCall={tc}
                        onViewFile={onViewFile}
                      />
                    ))}
                  </div>
                )}

                {/* Markdown text body */}
                {msg.content && (
                  <div className="prose prose-invert prose-xs max-w-none break-words leading-relaxed">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}

                {/* Error notice */}
                {msg.error && (
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-950/30 p-2 rounded border border-rose-900/50">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Error executing request. Check execution logs in workspace drawer.</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-xs mt-0.5 text-zinc-300">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Reasoning indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-sm">
              {agent.avatar}
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs flex items-center gap-2 text-zinc-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>{agent.name} is reasoning & evaluating tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <footer className="p-3 border-t border-zinc-800/80 bg-zinc-900/50">
        <form
          onSubmit={handleSubmit}
          className="relative bg-zinc-950 border border-zinc-800 rounded-xl focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 shadow-inner"
        >
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}... (Press Enter to send, Shift+Enter for newline)`}
            className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 p-3 pr-20 resize-none focus:outline-none leading-relaxed"
          />

          <div className="absolute right-2.5 bottom-2 flex items-center gap-1.5">
            <button
              id="send-message-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                !inputText.trim() || isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-zinc-400">
          <span>Harness: Sandboxed tools active (`execute_code`, `file_writer`, `web_search`)</span>
          <span>Local-first storage persisted</span>
        </div>
      </footer>
    </div>
  );
};
