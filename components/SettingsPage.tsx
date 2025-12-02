import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { AppSettings } from './SettingsModal';
import { getUserPlan, getUsageData, getRemainingGenerations } from '../lib/usage';
import { PlanTier } from '../lib/plan';
import { loadStripe } from '@stripe/stripe-js';
import { useUser } from '@clerk/clerk-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface SettingsPageProps {
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  isDarkMode?: boolean;
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

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, onSave, isDarkMode: propIsDarkMode }) => {
  const { user } = useUser();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('api-keys');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [validated, setValidated] = useState<Record<string, boolean | null>>({});
  const [userPlan, setUserPlan] = useState<PlanTier>('free');
  const [usageData, setUsageData] = useState({ generations: 0, remaining: 10 });
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('giton-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    
    // Load plan and usage
    const plan = getUserPlan();
    setUserPlan(plan);
    const usage = getUsageData();
    const remaining = getRemainingGenerations(plan);
    setUsageData({ generations: usage.generations, remaining });
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
    if (!apiKey || apiKey.trim() === '') {
      setValidated(prev => ({ ...prev, [keyName]: false }));
      return;
    }
    
    setValidating(prev => ({ ...prev, [keyName]: true }));
    
    // Simple validation - just check if key has proper format
    let isValid = false;
    
    if (keyName === 'geminiApiKey') {
      isValid = apiKey.length > 20;
    } else if (keyName === 'openaiApiKey') {
      isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
    } else if (keyName === 'openRouterApiKey') {
      isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
    } else {
      isValid = apiKey.length > 10;
    }
    
    setTimeout(() => {
      setValidated(prev => ({ ...prev, [keyName]: isValid }));
      setValidating(prev => ({ ...prev, [keyName]: false }));
    }, 500);
  };

  const toggleShowKey = (keyName: string) => {
    setShowApiKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleUpgrade = () => {
    alert('To upgrade to Pro, please contact sales at info@reliatrrack.org');
  };

  const sections = [
    { id: 'api-keys', label: 'API Keys', icon: 'key' },
    { id: 'preferences', label: 'Preferences', icon: 'settings' },
    { id: 'billing', label: 'Billing', icon: 'credit-card' },
  ];

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : settings.theme === 'dark';

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* GitHub-style Header */}
      <header className={`border-b ${isDarkMode ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className={isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}>
              <Icon icon="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
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
        <nav className={`w-64 border-r p-4 ${isDarkMode ? 'border-white/10 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-600/20 text-purple-600 font-medium'
                    : isDarkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                  <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>API Keys</h2>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Manage your API keys for AI services</p>
                </div>

                {/* API Keys Table */}
                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Service</th>
                        <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>API Key</th>
                        <th className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Status</th>
                        <th className={`text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Actions</th>
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
                              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Google Gemini</div>
                              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Recommended</div>
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
                              className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? "bg-black/30 border-white/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
                            />
                            <button
                              onClick={() => toggleShowKey('geminiApiKey')}
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
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
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
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
                              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>OpenRouter</div>
                              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Multiple models</div>
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
                              className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? "bg-black/30 border-white/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
                            />
                            <button
                              onClick={() => toggleShowKey('openRouterApiKey')}
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
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
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
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
                              <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>OpenAI</div>
                              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>GPT models</div>
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
                              className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode ? "bg-black/30 border-white/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
                            />
                            <button
                              onClick={() => toggleShowKey('openaiApiKey')}
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
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
                              className={`p-2 transition-colors ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                            >
                              <Icon icon="external-link" className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>


              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Preferences</h2>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Customize your GitOn experience</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className={`text-base font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Auto Save Projects</h3>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Automatically save analyzed repositories</p>
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
                      <h3 className={`text-base font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Theme</h3>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Choose your preferred theme</p>
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
                  <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Billing & Usage</h2>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Manage your subscription and track usage</p>
                </div>

                {/* Current Plan Status */}
                <div className={`border rounded-lg p-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${userPlan === 'pro' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-600'}`}>
                        <Icon icon={userPlan === 'pro' ? 'crown' : 'user'} className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {userPlan === 'pro' ? 'GitOn Pro' : 'Free Plan'}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {userPlan === 'pro' ? 'Unlimited access to all features' : 'Limited to 10 card detail generations'}
                        </p>
                      </div>
                    </div>
                    {userPlan === 'pro' && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Usage Stats */}
                  <div className={`border-t pt-4 mt-4 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Generations Used</span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {userPlan === 'pro' ? `${usageData.generations} (Unlimited)` : `${usageData.generations} / 10`}
                      </span>
                    </div>
                    {userPlan === 'free' && (
                      <>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(usageData.generations / 10) * 100}%` }}
                          />
                        </div>
                        <p className={`text-xs ${usageData.remaining <= 2 ? 'text-red-400' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {usageData.remaining} generations remaining
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Upgrade Card */}
                {userPlan === 'free' && (
                  <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon icon="crown" className="w-8 h-8 text-yellow-400" />
                      <div>
                        <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>GitOn Pro</h3>
                        <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Unlock unlimited analysis</p>
                      </div>
                    </div>
                    
                    <div className="my-6">
                      <span className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>$19.99</span>
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>/month</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {['Unlimited card generations', 'Unlimited repo browsing', 'Priority AI processing', 'Priority support'].map((feature) => (
                        <li key={feature} className={`flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          <Icon icon="check" className="w-5 h-5 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {isUpgrading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Upgrade to Pro'
                      )}
                    </button>
                  </div>
                )}

                {/* Pro Plan Management */}
                {userPlan === 'pro' && (
                  <div className={`border rounded-lg p-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Subscription</h3>
                    <div className="space-y-3">
                      <button className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        Update Payment Method
                      </button>
                      <button className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                        View Billing History
                      </button>
                      <button className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors">
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
