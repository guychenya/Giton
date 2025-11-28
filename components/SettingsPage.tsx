import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { AppSettings } from './SettingsModal';

interface SettingsPageProps {
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  geminiApiKey: '',
  huggingFaceApiKey: '',
  openaiApiKey: '',
  openRouterApiKey: '',
  elevenLabsApiKey: '',
  preferredLLM: 'gemini',
  preferredModel: 'anthropic/claude-3.5-sonnet',
  voiceEnabled: true,
  alwaysListening: false,
  theme: 'dark',
  autoSave: true,
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('api-keys');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('giton-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('giton-settings', JSON.stringify(settings));
    onSave(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: 'api-keys', label: 'API Keys', icon: 'key' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'billing', label: 'Billing', icon: 'credit-card' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden">
      {/* GitHub-style Header */}
      <header className="border-b border-white/10 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <Icon icon="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 border-r border-white/10 bg-gray-900/50 p-4">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-600/20 text-purple-300 font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon icon={section.icon} className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            {activeSection === 'api-keys' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">API Keys</h2>
                  <p className="text-gray-400">Configure your API keys for AI services</p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                  >
                    <Icon icon={showApiKeys ? 'eye-off' : 'eye'} className="w-4 h-4" />
                    {showApiKeys ? 'Hide' : 'Show'} API Keys
                  </button>
                </div>

                {/* Gemini */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Google Gemini</h3>
                      <p className="text-sm text-gray-400">Best for voice and live interactions</p>
                    </div>
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">Recommended</span>
                  </div>
                  <input
                    type={showApiKeys ? 'text' : 'password'}
                    value={settings.geminiApiKey}
                    onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block"
                  >
                    Get API Key →
                  </a>
                </div>

                {/* OpenRouter */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">OpenRouter</h3>
                      <p className="text-sm text-gray-400">Access Claude, GPT-4, Llama & more</p>
                    </div>
                  </div>
                  <input
                    type={showApiKeys ? 'text' : 'password'}
                    value={settings.openRouterApiKey}
                    onChange={(e) => updateSetting('openRouterApiKey', e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block"
                  >
                    Get API Key →
                  </a>
                </div>

                {/* OpenAI */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">OpenAI</h3>
                      <p className="text-sm text-gray-400">Direct access to GPT models</p>
                    </div>
                  </div>
                  <input
                    type={showApiKeys ? 'text' : 'password'}
                    value={settings.openaiApiKey}
                    onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block"
                  >
                    Get API Key →
                  </a>
                </div>

                {/* Preferred Provider */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Preferred AI Provider</h3>
                  <select
                    value={settings.preferredLLM}
                    onChange={(e) => updateSetting('preferredLLM', e.target.value as any)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
                  <p className="text-gray-400">Customize your GitOn experience</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white mb-1">Auto Save Projects</h3>
                      <p className="text-sm text-gray-400">Automatically save analyzed repositories</p>
                    </div>
                    <button
                      onClick={() => updateSetting('autoSave', !settings.autoSave)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoSave ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white mb-1">Theme</h3>
                      <p className="text-sm text-gray-400">Choose your preferred theme</p>
                    </div>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', e.target.value as any)}
                      className="bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Billing</h2>
                  <p className="text-gray-400">Manage your subscription and billing</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon icon="crown" className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="text-2xl font-bold text-white">GitOn Pro</h3>
                      <p className="text-gray-300">Unlock unlimited analysis</p>
                    </div>
                  </div>
                  
                  <div className="my-6">
                    <span className="text-4xl font-bold text-white">$19.99</span>
                    <span className="text-gray-400">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {['Unlimited repositories', 'Priority AI processing', 'Advanced features', 'Priority support'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-300">
                        <Icon icon="check" className="w-5 h-5 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
