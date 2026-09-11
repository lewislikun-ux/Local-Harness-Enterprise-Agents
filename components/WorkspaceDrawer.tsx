import React, { useState } from 'react';
import { WorkspaceFile, ExecutionLog } from '../types/index.ts';
import {
  FileText,
  FileCode,
  Terminal,
  Activity,
  Copy,
  Download,
  Trash2,
  Play,
  Check,
  RefreshCw,
  Plus,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
} from 'lucide-react';

interface WorkspaceDrawerProps {
  files: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  onSelectFile: (file: WorkspaceFile) => void;
  onSaveFile: (path: string, content: string) => void;
  onDeleteFile: (path: string) => void;
  onExecuteCodeInSandbox: (code: string, language?: 'javascript' | 'python') => void;
  logs: ExecutionLog[];
  onRefreshLogs?: () => void;
  isExecuting?: boolean;
}

export const WorkspaceDrawer: React.FC<WorkspaceDrawerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onSaveFile,
  onDeleteFile,
  onExecuteCodeInSandbox,
  logs,
  onRefreshLogs,
  isExecuting,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'logs' | 'sandbox'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'genai' | 'tool' | 'sandbox'>('all');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [scratchpadCode, setScratchpadCode] = useState(
    '// Quick sandbox test\nconst arr = [1, 2, 3, 4, 5];\nconsole.log("Sum:", arr.reduce((a, b) => a + b, 0));\nresult = "OK";'
  );

  // Sync editor content when active file changes
  React.useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      setIsEditing(false);
    }
  }, [activeFile?.path, activeFile?.content]);

  const handleCopyContent = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onSaveFile(newFilePath.trim(), '// New workspace source file\n');
    setNewFilePath('');
    setIsCreatingFile(false);
  };

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.category === logFilter;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80 text-zinc-300">
      {/* Drawer Tab Headers */}
      <div className="flex items-center justify-between px-3 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="flex items-center space-x-1">
          <button
            id="tab-files-btn"
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Files
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 ml-0.5">
              {files.length}
            </span>
          </button>

          <button
            id="tab-logs-btn"
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Logs
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 ml-0.5">
              {logs.length}
            </span>
          </button>

          <button
            id="tab-sandbox-btn"
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sandbox'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Sandbox State
          </button>
        </div>

        {activeTab === 'logs' && onRefreshLogs && (
          <button
            type="button"
            onClick={onRefreshLogs}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab 1: Virtual Workspace Files */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* File explorer toolbar */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="search-files-input"
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button
              id="new-file-btn"
              type="button"
              onClick={() => setIsCreatingFile(!isCreatingFile)}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors shrink-0"
              title="Create new file"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {/* New file form prompt */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-zinc-800 bg-zinc-900/70 flex gap-2">
              <input
                type="text"
                placeholder="src/example.js"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                autoFocus
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFile(false)}
                className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-xs"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Master-detail split: File List on top or left, editor view below */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* File List Strip */}
            <div className="h-36 overflow-y-auto border-b border-zinc-800 bg-zinc-950/40 divide-y divide-zinc-900/60 shrink-0">
              {filteredFiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No files found. Ask the agent to generate code!
                </div>
              ) : (
                filteredFiles.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => onSelectFile(f)}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                      activeFile?.path === f.path
                        ? 'bg-zinc-800/80 text-emerald-400 font-mono'
                        : 'hover:bg-zinc-900 text-zinc-400 font-mono'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      <span className="truncate">{f.path}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-500 font-sans">
                        {Math.round(f.size / 10) / 100} KB
                      </span>
                      <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {f.language}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Active File Content Viewer / Editor */}
            {activeFile ? (
              <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
                {/* File actions bar */}
                <div className="px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-zinc-200 font-medium truncate">
                      {activeFile.path}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      ({activeFile.content.split('\n').length} lines)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(activeFile.language === 'javascript' || activeFile.language === 'python') && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteCodeInSandbox(
                            activeFile.content,
                            activeFile.language as 'javascript' | 'python'
                          )
                        }
                        disabled={isExecuting}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 hover:bg-amber-900/60 text-amber-300 text-[11px] transition-colors"
                        title="Run this code directly in Sandbox"
                      >
                        <Play className="w-3 h-3 fill-amber-300" />
                        Run
                      </button>
                    )}

                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveFile(activeFile.path, editorContent);
                          setIsEditing(false);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px]"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyContent}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      title="Copy content"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteFile(activeFile.path)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editor / Code display */}
                <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-zinc-950 text-zinc-200">
                  {isEditing ? (
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full h-full bg-transparent text-zinc-200 font-mono resize-none focus:outline-none leading-relaxed"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="whitespace-pre overflow-x-auto leading-relaxed text-zinc-300">
                      {activeFile.content}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 p-6 text-center">
                Select a file from the workspace list above to inspect its code.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Execution Logs */}
      {activeTab === 'logs' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-2 border-b border-zinc-800 flex items-center gap-1 text-[11px] bg-zinc-900/30">
            <span className="text-zinc-500 mr-1">Filter:</span>
            {(['all', 'genai', 'tool', 'sandbox'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setLogFilter(cat)}
                className={`px-2 py-0.5 rounded capitalize ${
                  logFilter === cat
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[11px]">
            {filteredLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 font-sans">
                No logs recorded for this category yet.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border transition-colors ${
                    log.level === 'error'
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                      : log.level === 'warn'
                      ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                      : log.category === 'genai'
                      ? 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                      : log.category === 'tool'
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1 font-sans">
                    <span className="uppercase tracking-wider font-semibold">
                      [{log.category}] • {log.level}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="font-sans text-xs mb-1 font-medium text-zinc-200">
                    {log.message}
                  </div>
                  {log.metadata && (
                    <pre className="text-[10px] p-1.5 rounded bg-zinc-950/70 border border-zinc-800/60 overflow-x-auto text-zinc-400">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Active Sandbox State & Scratchpad */}
      {activeTab === 'sandbox' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Runtime Status */}
          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-medium font-sans">
              <ShieldCheck className="w-4 h-4" />
              <span>Safe Execution Runtime: Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block">Timeout</span>
                <span className="font-mono text-zinc-200">5,000 ms</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block">Memory Isolation</span>
                <span className="font-mono text-zinc-200">Isolated Scope</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block">Allowed Tools</span>
                <span className="font-mono text-zinc-200">4 Registered</span>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-500 block">Workspace Storage</span>
                <span className="font-mono text-zinc-200">{files.length} files stored</span>
              </div>
            </div>
          </div>

          {/* Registered Tools */}
          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <div className="text-zinc-300 font-medium mb-2 font-sans flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Registered MVP Tools
            </div>
            <ul className="space-y-1.5 text-[11px] font-mono">
              <li className="flex items-center justify-between text-zinc-300 p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span>execute_code(code, language)</span>
                <span className="text-[10px] text-emerald-400 font-sans">Ready</span>
              </li>
              <li className="flex items-center justify-between text-zinc-300 p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span>file_writer(path, content)</span>
                <span className="text-[10px] text-emerald-400 font-sans">Ready</span>
              </li>
              <li className="flex items-center justify-between text-zinc-300 p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span>web_search(query)</span>
                <span className="text-[10px] text-emerald-400 font-sans">Ready</span>
              </li>
              <li className="flex items-center justify-between text-zinc-300 p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <span>fetch_url(url)</span>
                <span className="text-[10px] text-emerald-400 font-sans">Ready</span>
              </li>
            </ul>
          </div>

          {/* Interactive Scratchpad */}
          <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-zinc-300 font-medium font-sans flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Live Sandbox Scratchpad
              </div>
              <button
                type="button"
                onClick={() => onExecuteCodeInSandbox(scratchpadCode, 'javascript')}
                disabled={isExecuting}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3 fill-white" />
                Test Run
              </button>
            </div>
            <textarea
              value={scratchpadCode}
              onChange={(e) => setScratchpadCode(e.target.value)}
              rows={5}
              className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
            <p className="text-[11px] text-zinc-500 font-sans">
              Test code execution live in the harness without sending an LLM turn. Output will stream to the Execution Logs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
