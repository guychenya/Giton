import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose, isDarkMode = true }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 border-white/20' : 'bg-white border-gray-300'}`}>
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b p-6 ${isDarkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</h2>
            <button onClick={onClose} className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`p-8 space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <p className="text-sm text-gray-500">Last updated: December 2, 2024</p>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. Information We Collect</h3>
            <p>We collect the following information:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Account Information:</strong> Email, name, and authentication data via Clerk</li>
              <li><strong>Usage Data:</strong> Repository URLs analyzed, generation counts, and feature usage</li>
              <li><strong>API Keys:</strong> Stored locally in your browser (not on our servers)</li>
              <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details)</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. How We Use Your Information</h3>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Provide and improve our AI analysis services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service updates and support communications</li>
              <li>Analyze usage patterns to enhance features</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. Data Storage</h3>
            <p><strong>Local Storage:</strong> API keys, settings, and saved projects are stored in your browser's IndexedDB and localStorage. This data never leaves your device.</p>
            <p className="mt-2"><strong>Cloud Storage:</strong> Account information and usage data are stored securely with our service providers (Clerk, Netlify).</p>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4. Third-Party Services</h3>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Google Gemini, OpenAI, OpenRouter:</strong> AI analysis (when you provide API keys)</li>
              <li><strong>GitHub API:</strong> Repository data retrieval</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5. Cookies</h3>
            <p>We use cookies and similar technologies for:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Authentication and session management</li>
              <li>Remembering your preferences</li>
              <li>Analytics and performance monitoring</li>
            </ul>
            <p className="mt-2">You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6. Data Security</h3>
            <p>We implement industry-standard security measures including encryption, secure connections (HTTPS), and regular security audits. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>7. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8. Contact</h3>
            <p>For privacy concerns, contact us at: <a href="mailto:info@reliatrrack.org" className="text-purple-400 hover:text-purple-300">info@reliatrrack.org</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
