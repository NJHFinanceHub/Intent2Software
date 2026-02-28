import { useState, useEffect } from 'react';
import { Save, Key, Check } from 'lucide-react';
import { usersApi } from '../api/client';
import { useStore } from '../store';
import { AIProvider } from '@intent-platform/shared';

export default function SettingsPage() {
  const { aiConfig, setAIConfig } = useStore();
  const [config, setConfig] = useState({
    provider: AIProvider.ANTHROPIC,
    apiKey: '',
    model: '',
    temperature: 0.7
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (aiConfig) {
      setConfig({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey || '',
        model: aiConfig.model || '',
        temperature: aiConfig.temperature || 0.7
      });
    }
  }, [aiConfig]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await usersApi.updateAIConfig(config);
      setAIConfig(config);
      // Clear the API key from local state after saving
      setConfig((prev) => ({ ...prev, apiKey: '' }));
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure your AI provider and preferences</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 space-y-6">
          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as AIProvider })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value={AIProvider.ANTHROPIC}>Anthropic Claude</option>
              <option value={AIProvider.OPENAI}>OpenAI GPT-4</option>
              <option value={AIProvider.MOCK}>Mock (for testing)</option>
            </select>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Choose which AI provider to use for code generation
            </p>
          </div>

          {/* API Key */}
          {config.provider !== AIProvider.MOCK && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Key className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400" />
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all font-mono"
                placeholder={
                  config.provider === AIProvider.ANTHROPIC
                    ? 'sk-ant-...'
                    : 'sk-...'
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                {config.provider === AIProvider.ANTHROPIC
                  ? 'Get your API key from console.anthropic.com'
                  : 'Get your API key from platform.openai.com'}
              </p>
            </div>
          )}

          {/* Model */}
          {config.provider !== AIProvider.MOCK && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Model <span className="text-zinc-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all font-mono"
                placeholder={
                  config.provider === AIProvider.ANTHROPIC
                    ? 'claude-3-5-sonnet-20241022'
                    : 'gpt-4-turbo-preview'
                }
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Leave blank to use default model
              </p>
            </div>
          )}

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Temperature <span className="text-cyan-400 ml-1">{config.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-950 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] text-zinc-500 mt-1.5">
              <span>More focused</span>
              <span>More creative</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
          {saveMessage && (
            <span className={`flex items-center gap-1.5 text-xs ${
              saveMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {!saveMessage.includes('Failed') && <Check className="w-3.5 h-3.5" />}
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || (!config.apiKey && config.provider !== AIProvider.MOCK)}
            className="ml-auto flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-xl text-sm font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
