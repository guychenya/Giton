import React, { useState, useEffect, useRef } from 'react';
import { SignInButton } from '@clerk/clerk-react';
import Icon from './Icon';

const DemoVideo: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 2.5;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted
          playsInline
          className="w-full h-auto"
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
        <audio 
          ref={audioRef}
          autoPlay 
          loop
        >
          <source src="/demo-audio.mp4" type="audio/mp4" />
        </audio>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Music: Heaven and Hell by Jeremy Blake (YouTube Audio Library)
      </p>
    </div>
  );
};

const DemoSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`
        );
        const data = await response.json();
        setResults(data.items || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div id="demo-search" className="mt-16 max-w-2xl mx-auto animate-slide-up animation-delay-1000" ref={searchRef}>
      <p className="text-gray-400 text-sm mb-4">Try it now - Search any GitHub repository</p>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Enter username/repo or paste GitHub URL..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
        />
        {loading && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <SignInButton mode="modal">
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6 py-2 rounded-lg transition-all">
            Analyze
          </button>
        </SignInButton>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
            {results.map((repo) => (
              <SignInButton key={repo.id} mode="modal">
                <button className="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{repo.full_name}</div>
                      <div className="text-gray-400 text-sm truncate mt-1">{repo.description || 'No description'}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span className="text-yellow-400 text-sm flex items-center gap-1">
                        <Icon icon="star" className="w-4 h-4" />
                        {(repo.stargazers_count / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </button>
              </SignInButton>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">Sign in to start analyzing repositories for free</p>
    </div>
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden flex flex-col">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Floating Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-sm text-purple-300 font-medium">AI-Powered Repository Analysis</span>
          </div>

          {/* Main Heading with Gradient */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 animate-slide-up">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 animate-gradient">
              GitOn
            </span>
          </h1>
          
          <p className="text-2xl md:text-4xl text-gray-300 mb-6 font-bold animate-slide-up animation-delay-200">
            Understand Any Repository
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">In Seconds</span>
          </p>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-400">
            Transform complex codebases into clear documentation, interactive diagrams, and actionable insights with the power of AI.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up animation-delay-600">
            <SignInButton mode="modal">
              <button className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-bold px-10 py-5 rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </button>
            </SignInButton>
            
            <button 
              onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="text-gray-300 hover:text-white text-lg font-semibold px-10 py-5 rounded-xl border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 flex items-center gap-2"
            >
              <Icon icon="play" className="w-5 h-5" />
              See It In Action
            </button>
          </div>


          
          {/* Demo Search */}
          <DemoSearch />
        </div>
      </div>

      {/* Demo Video Section */}
      <div id="demo-video" className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">See GitOn In Action</h2>
            <p className="text-xl text-gray-400">Everything you need to understand any codebase</p>
          </div>
          
          <div className="animate-slide-up">
            <DemoVideo />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center border-t border-white/5">
        <p className="text-gray-500 text-sm">© 2024 GitOn. Built with ❤️ by <a href="https://www.linkedin.com/in/guychenya/" target="_blank" className="text-purple-400 hover:text-purple-300 transition-colors">Guy Chenya</a></p>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
          opacity: 0;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
