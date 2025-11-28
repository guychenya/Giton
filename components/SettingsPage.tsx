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
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validated, setValidated] = useState<Record<string, boolean | null>>({});

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
    // Clear validation when key changes
    if (key.toString().includes('ApiKey')) {
      setValidated(prev => ({ ...prev, [key.toString()]: null }));
    }
  };

  const validateApiKey = async (keyName: string, apiKey: string) => {
    if (!apiKey || apiKey.trim() === '') return;
    
    setValidating(prev => ({ ...prev, [keyName]: true }));
    
    try {
      let isValid = false;
      
      if (keyName === 'geminiApiKey') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        isValid = response.ok;
      } else if (keyName === 'openaiApiKey') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = response.ok;
      } else if (keyName === 'openRouterApiKey') {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        isValid = response.ok;
      } else {
        isValid = true; // Skip validation for other keys
      }
      
      setValidated(prev => ({ ...prev, [keyName]: isValid }));
    } catch (error) {
      setValidated(prev => ({ ...prev, [keyName]: false }));
    } finally {
      setValidating(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowApiKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">API Keys</h2>
                  <p className="text-gray-400">Manage your API keys for AI services</p>
                </div>

                {/* API Keys Table */}
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">API Key</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {/* Gemini */}
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-purple-400 font-bold text-sm">G</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Google Gemini</div>
                              <div className="text-xs text-gray-400">Recommended</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type={showApiKeys['geminiApiKey'] ? 'text' : 'password'}
                              value={settings.geminiApiKey}
                              onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                              placeholder="sk-..." 
                              className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={() => toggleShowKey('geminiApiKey')}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title={showApiKeys['geminiApiKey'] ? 'Hide' : 'Show'}
                            >
                              <Icon icon={showApiKeys['geminiApiKey'] ? 'eye-off' : 'eye'} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {validated['geminiApiKey'] === true && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">
                              <Icon icon="check" className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {validated['geminiApiKey'] === false && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded">
                              <Icon icon="close" className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => validateApiKey('geminiApiKey', settings.geminiApiKey)}
                              disabled={validating['geminiApiKey'] || !settings.geminiApiKey}
                              className="p-2 text-yellow-400 hover:text-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Validate API Key"
                            >
                              {validating['geminiApiKey'] ? (
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Icon icon="lightning" className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Get API Key"
                            >
                              <Icon icon="external-link" className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* OpenRouter */}
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-blue-400 font-bold text-sm">OR</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">OpenRouter</div>
                              <div className="text-xs text-gray-400">Multiple models</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type={showApiKeys['openRouterApiKey'] ? 'text' : 'password'}
                              value={settings.openRouterApiKey}
                              onChange={(e) => updateSetting('openRouterApiKey', e.target.value)}
                              placeholder="sk-or-..."
                              className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={() => toggleShowKey('openRouterApiKey')}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <Icon icon={showApiKeys['openRouterApiKey'] ? 'eye-off' : 'eye'} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {validated['openRouterApiKey'] === true && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">
                              <Icon icon="check" className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {validated['openRouterApiKey'] === false && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded">
                              <Icon icon="close" className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => validateApiKey('openRouterApiKey', settings.openRouterApiKey)}
                              disabled={validating['openRouterApiKey'] || !settings.openRouterApiKey}
                              className="p-2 text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
                            >
                              {validating['openRouterApiKey'] ? (
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Icon icon="lightning" className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href="https://openrouter.ai/keys"
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <Icon icon="external-link" className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* OpenAI */}
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                              <span className="text-green-400 font-bold text-sm">AI</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">OpenAI</div>
                              <div className="text-xs text-gray-400">GPT models</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type={showApiKeys['openaiApiKey'] ? 'text' : 'password'}
                              value={settings.openaiApiKey}
                              onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                              placeholder="sk-..."
                              className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              onClick={() => toggleShowKey('openaiApiKey')}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <Icon icon={showApiKeys['openaiApiKey'] ? 'eye-off' : 'eye'} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {validated['openaiApiKey'] === true && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">
                              <Icon icon="check" className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {validated['openaiApiKey'] === false && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded">
                              <Icon icon="close" className="w-3 h-3" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => validateApiKey('openaiApiKey', settings.openaiApiKey)}
                              disabled={validating['openaiApiKey'] || !settings.openaiApiKey}
                              className="p-2 text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
                            >
                              {validating['openaiApiKey'] ? (
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Icon icon="lightning" className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <Icon icon="external-link" className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Preferred Provider */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Default AI Provider</label>
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
