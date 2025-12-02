import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import Icon from './Icon';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 mb-6">
            GitOn
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8">
            AI-Powered GitHub Repository Analysis
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Get instant documentation, architecture diagrams, and interactive analysis for any GitHub repository using advanced AI.
          </p>
          
          <SignInButton mode="modal">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-105">
              Get Started Free
            </button>
          </SignInButton>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="backend" className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Analysis</h3>
            <p className="text-gray-400">AI-powered documentation and code insights</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="document" className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Auto Diagrams</h3>
            <p className="text-gray-400">Generate architecture diagrams instantly</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="audio_spark" className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Assistant</h3>
            <p className="text-gray-400">Chat with AI about your codebase</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2024 GitOn. Built with ❤️ by Guy Chenya</p>
      </footer>
    </div>
  );
};

export default LandingPage;
