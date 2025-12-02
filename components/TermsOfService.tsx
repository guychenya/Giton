import React from 'react';

interface TermsOfServiceProps {
  onClose: () => void;
  isDarkMode?: boolean;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose, isDarkMode = true }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 border-white/20' : 'bg-white border-gray-300'}`}>
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b p-6 ${isDarkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Terms of Service</h2>
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
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. AI-Generated Content Disclaimer</h3>
            <p>GitOn uses artificial intelligence to analyze and generate content about GitHub repositories. <strong>We do not guarantee the accuracy, completeness, or reliability of any AI-generated content.</strong> All content is provided "as is" without warranty of any kind.</p>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. No Liability</h3>
            <p>GitOn and its creators are not responsible for:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Errors or inaccuracies in AI-generated documentation</li>
              <li>Decisions made based on AI-generated content</li>
              <li>Any damages resulting from use of this service</li>
              <li>Third-party content or repositories analyzed</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. User Responsibility</h3>
            <p>You are solely responsible for:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Verifying all AI-generated content before use</li>
              <li>Ensuring you have rights to analyze repositories</li>
              <li>Compliance with applicable laws and regulations</li>
              <li>Your use of API keys and third-party services</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4. Service Availability</h3>
            <p>GitOn is provided on an "as available" basis. We do not guarantee uninterrupted access or error-free operation. We reserve the right to modify or discontinue the service at any time.</p>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>5. Acceptable Use</h3>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Use the service for illegal purposes</li>
              <li>Attempt to reverse engineer or exploit the service</li>
              <li>Abuse or overload our systems</li>
              <li>Violate any third-party rights</li>
            </ul>
          </section>

          <section>
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>6. Contact</h3>
            <p>For questions about these terms, contact us at: <a href="mailto:info@reliatrrack.org" className="text-purple-400 hover:text-purple-300">info@reliatrrack.org</a></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
