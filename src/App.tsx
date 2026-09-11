import React, { useState, useEffect, useCallback } from 'react';
import { AgentPersona, ChatMessage, SystemSettings, WorkspaceFile, ExecutionLog } from '@/types/index.ts';
import {
  loadAgents,
  saveAgents,
  loadActiveAgentId,
  saveActiveAgentId,
  loadMessages,
  saveMessages,
  loadSettings,
  saveSettings,
} from '@/lib/storage.ts';
import { Sidebar } from '@/components/Sidebar.tsx';
import { ChatInterface } from '@/components/ChatInterface.tsx';
import { WorkspaceDrawer } from '@/components/WorkspaceDrawer.tsx';
import { SettingsModal } from '@/components/SettingsModal.tsx';
import { AgentModal } from '@/components/AgentModal.tsx';

export default function App() {
  const [agents, setAgents] = useState<AgentPersona[]>(() => loadAgents());
  const [activeAgentId, setActiveAgentId] = useState<string>(() =>
    loadActiveAgentId(loadAgents())
  );
  const [settings, setSettings] = useState<SystemSettings>(() => loadSettings());
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(loadActiveAgentId(loadAgents()))
  );
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // UI State
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<AgentPersona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingTool, setIsExecutingTool] = useState(false);

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  // Fetch initial files & logs from backend
  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [filesRes, logsRes] = await Promise.all([
        fetch('/api/sandbox/files'),
        fetch('/api/sandbox/logs'),
      ]);

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setWorkspaceFiles(filesData.files || []);
        if (filesData.files?.length > 0 && !activeFile) {
          setActiveFile(filesData.files[0]);
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Failed to sync initial workspace data:', err);
    }
  }, [activeFile]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // When active agent changes, load their conversation
  const handleSelectAgent = (id: string) => {
    setActiveAgentId(id);
    saveActiveAgentId(id);
    const msgs = loadMessages(id);
    setMessages(msgs);
  };

  // Send message through the agent harness
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveMessages(activeAgentId, updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          agent: activeAgent,
          settings,
        }),
      });

      if (!res.ok) {
        const rawText = await res.text();
        let errorDetail = `Server error (${res.status})`;
        try {
          const parsed = JSON.parse(rawText);
          errorDetail = parsed.error || errorDetail;
        } catch {
          if (res.status === 404) {
            errorDetail = 'API route not found (404). Verify that vercel.json and api/index.ts are deployed, and GEMINI_API_KEY is configured in Vercel settings.';
          } else {
            errorDetail = rawText.slice(0, 150) || errorDetail;
          }
        }
        throw new Error(errorDetail);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.content || '',
        agentId: activeAgentId,
        timestamp: Date.now(),
        toolCalls: data.toolCalls || [],
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveMessages(activeAgentId, finalMessages);

      if (data.files) {
        setWorkspaceFiles(data.files);
        // If an updated file was created and none is selected, select it
        if (data.toolCalls?.some((tc: any) => tc.name === 'file_writer')) {
          const writtenPath = data.toolCalls.find((tc: any) => tc.name === 'file_writer')?.args?.path;
          const targetFile = data.files.find((f: WorkspaceFile) => f.path === writtenPath);
          if (targetFile) setActiveFile(targetFile);
        }
      }

      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      console.error('Chat turn failed:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, an error occurred during orchestration: ${err.message}`,
        agentId: activeAgentId,
        timestamp: Date.now(),
        error: true,
      };

      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      saveMessages(activeAgentId, finalMessages);
      fetchWorkspaceData();
    } finally {
      setIsLoading(false);
    }
  };

  // Direct sandbox code execution from drawer or scratchpad
  const handleExecuteCodeInSandbox = async (code: string, language: 'javascript' | 'python' = 'javascript') => {
    setIsExecutingTool(true);
    try {
      const res = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'execute_code',
          args: { code, language },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) setWorkspaceFiles(data.files);
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.error('Direct sandbox execution failed:', err);
    } finally {
      setIsExecutingTool(false);
    }
  };

  // Workspace File Operations
  const handleSaveFile = async (path: string, content: string) => {
    try {
      const res = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setWorkspaceFiles(data.files);
          const saved = data.files.find((f: WorkspaceFile) => f.path === path);
          if (saved) setActiveFile(saved);
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleDeleteFile = async (path: string) => {
    try {
      const res = await fetch(`/api/sandbox/files?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setWorkspaceFiles(data.files);
          if (activeFile?.path === path) {
            setActiveFile(data.files[0] || null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleViewFile = (filePath: string) => {
    const file = workspaceFiles.find((f) => f.path === filePath);
    if (file) {
      setActiveFile(file);
      setIsWorkspaceOpen(true);
    } else {
      // Refresh files list
      fetchWorkspaceData().then(() => {
        setIsWorkspaceOpen(true);
      });
    }
  };

  // Agent Persona CRUD
  const handleSaveAgent = (agentData: AgentPersona) => {
    let updated: AgentPersona[];
    if (agents.some((a) => a.id === agentData.id)) {
      updated = agents.map((a) => (a.id === agentData.id ? agentData : a));
    } else {
      updated = [...agents, agentData];
    }
    setAgents(updated);
    saveAgents(updated);
    setActiveAgentId(agentData.id);
    saveActiveAgentId(agentData.id);
  };

  const handleDeleteAgent = (id: string) => {
    if (agents.length <= 1) return;
    const updated = agents.filter((a) => a.id !== id);
    setAgents(updated);
    saveAgents(updated);
    if (activeAgentId === id) {
      handleSelectAgent(updated[0].id);
    }
  };

  const handleClearChat = () => {
    const freshMessages: ChatMessage[] = [
      {
        id: `msg-welcome-${activeAgentId}`,
        role: 'assistant',
        content: `Conversation cleared. How can I assist you next?`,
        agentId: activeAgentId,
        timestamp: Date.now(),
      },
    ];
    setMessages(freshMessages);
    saveMessages(activeAgentId, freshMessages);
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Left Pane: Bot Roster & Navigation */}
      <Sidebar
        agents={agents}
        activeAgentId={activeAgentId}
        onSelectAgent={handleSelectAgent}
        onOpenCreateAgent={() => {
          setAgentToEdit(null);
          setIsAgentModalOpen(true);
        }}
        onOpenEditAgent={(agent) => {
          setAgentToEdit(agent);
          setIsAgentModalOpen(true);
        }}
        onDeleteAgent={handleDeleteAgent}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearChat={handleClearChat}
        activeProvider={settings.provider}
      />

      {/* Main Center Pane: Chat & Orchestration Feed */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatInterface
          agent={activeAgent}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenWorkspace={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          onViewFile={handleViewFile}
          isWorkspaceOpen={isWorkspaceOpen}
        />
      </main>

      {/* Right Drawer: Virtual Workspace & Sandbox State */}
      {isWorkspaceOpen && (
        <aside className="w-96 shrink-0 h-full flex flex-col">
          <WorkspaceDrawer
            files={workspaceFiles}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onSaveFile={handleSaveFile}
            onDeleteFile={handleDeleteFile}
            onExecuteCodeInSandbox={handleExecuteCodeInSandbox}
            logs={logs}
            onRefreshLogs={fetchWorkspaceData}
            isExecuting={isExecutingTool}
          />
        </aside>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSaveAgent={handleSaveAgent}
        agentToEdit={agentToEdit}
      />
    </div>
  );
}
