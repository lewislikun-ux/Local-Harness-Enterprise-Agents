import React, { useState } from 'react';
import { SystemSettings } from '../types/index.ts';
import { AVAILABLE_MODELS } from '../lib/config/constants.ts';
import { X, Key, Cpu, Sliders, Shield, Check, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden text-zinc-200 text-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-zinc-100">Harness & Provider Settings</h2>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              LLM Provider Gateway
            </label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  provider: e.target.value as 'gemini' | 'local',
                  defaultModel:
                    e.target.value === 'local'
                      ? 'qwen-2.5-coder-local'
                      : 'gemini-2.3-flash-lite',
                })
              }
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
            >
              <option value="gemini">Google Gemini (Default & Recommended)</option>
              <option value="local">Local / Simulated Offline Fallback</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Default Model Router
            </label>
            <select
              value={formData.defaultModel}
              onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
            >
              {AVAILABLE_MODELS.filter((m) =>
                formData.provider === 'local' ? m.provider === 'local' : m.provider === 'gemini'
              ).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} — {model.recommendedFor}
                </option>
              ))}
            </select>
          </div>

          {/* Optional API Key Override */}
          {formData.provider === 'gemini' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Gemini API Key (Optional Override)
                </label>
              </div>
              <input
                type="password"
                placeholder="Leave blank to use injected GEMINI_API_KEY"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
              <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
                <Info className="w-3 h-3 text-zinc-400 shrink-0" />
                By default, the server securely reads from environment secrets.
              </p>
            </div>
          )}

          {/* Local endpoint */}
          {formData.provider === 'local' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Local Endpoint (Ollama / LocalAI URL)
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={formData.localEndpoint || ''}
                onChange={(e) => setFormData({ ...formData, localEndpoint: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>
          )}

          {/* Tool Execution Policy */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-medium text-zinc-300">
                    Autonomous Tool Execution
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Allow agents to call sandboxed tools during chat turns
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoExecuteTools}
                onChange={(e) =>
                  setFormData({ ...formData, autoExecuteTools: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 bg-zinc-900 border-zinc-700 rounded"
              />
            </label>
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
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              {savedSuccess ? 'Saved' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
