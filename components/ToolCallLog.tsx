import React, { useState } from 'react';
import { ToolCall } from '../types/index.ts';
import {
  Code,
  FileCode2,
  Globe,
  Link,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  ExternalLink,
} from 'lucide-react';

interface ToolCallLogProps {
  toolCall: ToolCall;
  onViewFile?: (filePath: string) => void;
}

export const ToolCallLog: React.FC<ToolCallLogProps> = ({ toolCall, onViewFile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'execute_code':
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      case 'file_writer':
        return <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'web_search':
        return <Globe className="w-3.5 h-3.5 text-sky-400" />;
      case 'fetch_url':
        return <Link className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Code className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (toolCall.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            executing
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            success
            {toolCall.durationMs !== undefined && (
              <span className="text-zinc-500 font-sans ml-0.5">({toolCall.durationMs}ms)</span>
            )}
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-2.5 h-2.5" />
            error
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            queued
          </span>
        );
    }
  };

  return (
    <div className="my-2 border border-zinc-800 rounded-lg bg-zinc-900/80 overflow-hidden text-xs">
      {/* Header Bar */}
      <button
        type="button"
        id={`tool-log-header-${toolCall.id}`}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="p-1 rounded bg-zinc-800 border border-zinc-700/50">
            {getToolIcon(toolCall.name)}
          </span>
          <span className="font-mono font-medium text-zinc-200">
            tool:{toolCall.name}
          </span>
          {toolCall.name === 'file_writer' && toolCall.args?.path && (
            <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[200px]">
              &rarr; {toolCall.args.path}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {toolCall.name === 'file_writer' && toolCall.args?.path && onViewFile && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onViewFile(toolCall.args.path);
              }}
              className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 text-[11px] font-sans px-1.5 py-0.5 rounded hover:bg-zinc-800"
              title="Open file in workspace drawer"
            >
              <ExternalLink className="w-3 h-3" />
              open file
            </span>
          )}
          {getStatusBadge()}
        </div>
      </button>

      {/* Collapsible Content: Inputs and Outputs */}
      {isExpanded && (
        <div className="p-3 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950/60 font-mono text-[11px]">
          {/* Tool Arguments */}
          <div>
            <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-sans font-semibold mb-1">
              Input Parameters
            </div>
            <pre className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-48">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {/* Tool Result / Output */}
          {toolCall.result !== undefined && (
            <div>
              <div className="text-zinc-500 uppercase tracking-wider text-[10px] font-sans font-semibold mb-1">
                Sandbox Output
              </div>
              <pre className="p-2 rounded bg-zinc-900/90 border border-emerald-950/50 text-emerald-300/90 overflow-x-auto whitespace-pre-wrap max-h-60">
                {typeof toolCall.result === 'object'
                  ? JSON.stringify(toolCall.result, null, 2)
                  : String(toolCall.result)}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {toolCall.error && (
            <div>
              <div className="text-rose-500 uppercase tracking-wider text-[10px] font-sans font-semibold mb-1">
                Execution Error
              </div>
              <pre className="p-2 rounded bg-rose-950/30 border border-rose-900/50 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
