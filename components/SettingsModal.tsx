import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  isDarkMode?: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  huggingFaceApiKey: string;
  openaiApiKey: string;
  openRouterApiKey: string;
  elevenLabsApiKey: string;
  preferredLLM: 'gemini' | 'huggingface' | 'openai' | 'openrouter';
  preferredModel: string;
  voiceEnabled: boolean;
  alwaysListening: boolean;
  theme: 'dark' | 'light';
  autoSave: boolean;
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

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, isDarkMode = true }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'api' | 'preferences' | 'billing'>('api');
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('giton-settings');
      if (saved) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('giton-settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${isDarkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-300'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Icon icon="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          {[
            { id: 'api', label: 'API Keys', icon: 'key' },
            { id: 'preferences', label: 'Preferences', icon: 'settings' },
            { id: 'billing', label: 'Billing', icon: 'credit-card' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon icon={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">API Configuration</h3>
                <button
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Icon icon={showApiKeys ? "eye-off" : "eye"} className="w-4 h-4" />
                  {showApiKeys ? 'Hide' : 'Show'} Keys
                </button>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Google Gemini API Key
                  <span className="text-green-400 ml-1">✓ Best Voice Experience</span>
                </label>
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.geminiApiKey}
                  onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-purple-400 hover:underline">Google AI Studio</a> - Enables Gemini Live
                </p>
              </div>

              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ElevenLabs API Key
                  <span className="text-blue-400 ml-1">Premium Voice</span>
                </label>
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.elevenLabsApiKey}
                  onChange={(e) => updateSetting('elevenLabsApiKey', e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your key from <a href="https://elevenlabs.io/app/speech-synthesis" target="_blank" className="text-blue-400 hover:underline">ElevenLabs</a> - Professional voice synthesis
                </p>
              </div>

              {/* HuggingFace API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  HuggingFace API Key
                  <span className="text-blue-400 ml-1">Free Tier Available</span>
                </label>
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.huggingFaceApiKey}
                  onChange={(e) => updateSetting('huggingFaceApiKey', e.target.value)}
                  placeholder="Enter your HuggingFace API key"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your key from <a href="https://huggingface.co/settings/tokens" target="_blank" className="text-blue-400 hover:underline">HuggingFace Settings</a>
                </p>
              </div>

              {/* OpenRouter API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenRouter API Key
                  <span className="text-green-400 ml-1">✓ Best Choice</span>
                </label>
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.openRouterApiKey}
                  onChange={(e) => updateSetting('openRouterApiKey', e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your key from <a href="https://openrouter.ai/keys" target="_blank" className="text-green-400 hover:underline">OpenRouter</a> - Access Claude, GPT-4, Llama & more
                </p>
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  OpenAI API Key
                  <span className="text-yellow-400 ml-1">Premium</span>
                </label>
                <input
                  type={showApiKeys ? "text" : "password"}
                  value={settings.openaiApiKey}
                  onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-yellow-400 hover:underline">OpenAI Platform</a>
                </p>
              </div>

              {/* Preferred LLM */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred LLM Provider
                </label>
                <select
                  value={settings.preferredLLM}
                  onChange={(e) => updateSetting('preferredLLM', e.target.value as any)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gemini">Google Gemini (Best Voice + Live API)</option>
                  <option value="openrouter">OpenRouter (Multiple Models)</option>
                  <option value="openai">OpenAI Direct</option>
                  <option value="huggingface">HuggingFace (Limited)</option>
                </select>
              </div>

              {/* Model Selection for OpenRouter */}
              {settings.preferredLLM === 'openrouter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Model
                  </label>
                  <select
                    value={settings.preferredModel}
                    onChange={(e) => updateSetting('preferredModel', e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Best)</option>
                    <option value="openai/gpt-4o">GPT-4o</option>
                    <option value="openai/gpt-4o-mini">GPT-4o Mini (Faster)</option>
                    <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                    <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                    <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
                    <option value="mistralai/mistral-7b-instruct">Mistral 7B (Free)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Application Preferences</h3>

              {/* Voice Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Voice Assistant</label>
                  <p className="text-xs text-gray-400">Enable voice interaction features</p>
                </div>
                <button
                  onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.voiceEnabled ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Always Listening */}
              {settings.voiceEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Always Listening</label>
                    <p className="text-xs text-gray-400">Continuous voice activation (experimental)</p>
                  </div>
                  <button
                    onClick={() => updateSetting('alwaysListening', !settings.alwaysListening)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.alwaysListening ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.alwaysListening ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Auto Save */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Auto Save Projects</label>
                  <p className="text-xs text-gray-400">Automatically save analyzed repositories</p>
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

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as any)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Billing & Subscription</h3>
              
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon icon="crown" className="w-6 h-6 text-yellow-400" />
                  <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GitOn Pro</h4>
                </div>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Unlock unlimited repository analysis, priority support, and advanced AI features.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$19.99</span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>/month</span>
                  </div>
                  <button 
                    onClick={() => window.open('https://buy.stripe.com/test_placeholder', '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pro Features:</h5>
                <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li className="flex items-center gap-2">
                    <Icon icon="check" className="w-4 h-4 text-green-400" />
                    Unlimited repository analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="check" className="w-4 h-4 text-green-400" />
                    Priority AI processing
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="check" className="w-4 h-4 text-green-400" />
                    Advanced voice features
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="check" className="w-4 h-4 text-green-400" />
                    Export to multiple formats
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon icon="check" className="w-4 h-4 text-green-400" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;