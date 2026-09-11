import React, { useState } from 'react';
import { AgentPersona } from '../types/index.ts';
import { AVAILABLE_MODELS } from '../lib/config/constants.ts';
import { X, Bot, Sparkles, Check } from 'lucide-react';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent: (agent: AgentPersona) => void;
  agentToEdit?: AgentPersona | null;
}

const EMOJI_OPTIONS = ['🏗️', '🐒', '📊', '⚡', '🧠', '🛡️', '🧪', '🚀', '🔮', '🤖', '🕵️', '💡'];

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent,
  agentToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.3);
  const [systemPrompt, setSystemPrompt] = useState('');

  React.useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setRole(agentToEdit.role || '');
      setAvatar(agentToEdit.avatar);
      setModel(agentToEdit.model);
      setTemperature(agentToEdit.temperature);
      setSystemPrompt(agentToEdit.systemPrompt);
    } else {
      setName('');
      setRole('');
      setAvatar('🤖');
      setModel('gemini-2.5-flash');
      setTemperature(0.3);
      setSystemPrompt(
        'You are an expert AI developer agent with access to sandboxed tools (file_writer, execute_code, web_search, fetch_url).'
      );
    }
  }, [agentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const agent: AgentPersona = {
      id: agentToEdit?.id || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: name.trim(),
      role: role.trim() || 'Agent Specialist',
      avatar,
      model,
      temperature: Number(temperature),
      systemPrompt: systemPrompt.trim(),
    };

    onSaveAgent(agent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden text-zinc-200 text-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-zinc-100">
              {agentToEdit ? 'Configure Agent Persona' : 'Create New Agent Persona'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Avatar Identifier
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 text-lg rounded-lg border flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'border-emerald-500 bg-emerald-950/40 scale-105 shadow-sm'
                      : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800/80'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Role Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Agent Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Architect Alpha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Specialty Role
              </label>
              <input
                type="text"
                placeholder="e.g. Systems Architect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Model Assignment */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Base Model Assignment
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Temperature Creativity Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-1.5">
              <span>Temperature (Creativity: {temperature})</span>
              <span className="text-zinc-500 font-mono">
                {temperature <= 0.2 ? 'Deterministic/Precise' : temperature >= 0.7 ? 'Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* System Prompt instructions */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Custom Persona Instructions (System Prompt)
            </label>
            <textarea
              required
              rows={5}
              placeholder="Define this bot's personality, domain knowledge, coding conventions, and tool habits..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {agentToEdit ? 'Save Changes' : 'Create Bot Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
