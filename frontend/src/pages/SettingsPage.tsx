import { useState, useEffect } from 'react';
import { Save, Key } from 'lucide-react';
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
      await usersApi.updateAIConfig(config as any);
      setAIConfig(config as any);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your AI provider and preferences</p>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as AIProvider })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={AIProvider.ANTHROPIC}>Anthropic Claude</option>
              <option value={AIProvider.OPENAI}>OpenAI GPT-4</option>
              <option value={AIProvider.MOCK}>Mock (for testing)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose which AI provider to use for code generation
            </p>
          </div>

          {/* API Key */}
          {config.provider !== AIProvider.MOCK && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="w-4 h-4 inline mr-1" />
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  config.provider === AIProvider.ANTHROPIC
                    ? 'sk-ant-...'
                    : 'sk-...'
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.provider === AIProvider.ANTHROPIC
                  ? 'Get your API key from https://console.anthropic.com'
                  : 'Get your API key from https://platform.openai.com'}
              </p>
            </div>
          )}

          {/* Model */}
          {config.provider !== AIProvider.MOCK && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model (optional)
              </label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  config.provider === AIProvider.ANTHROPIC
                    ? 'claude-3-5-sonnet-20241022'
                    : 'gpt-4-turbo-preview'
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use default model
              </p>
            </div>
          )}

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More focused</span>
              <span>More creative</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {saveMessage && (
              <span className="text-sm text-green-600">{saveMessage}</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !config.apiKey}
              className="ml-auto flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
