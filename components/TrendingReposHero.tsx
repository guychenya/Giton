import React, { useEffect, useState } from 'react';
import { getTrendingAIRepos } from '../services/trendingService';
import Icon from './Icon';

interface TrendingReposHeroProps {
  isDarkMode: boolean;
  onSelectRepo: (owner: string, repo: string) => void;
}

const TrendingReposHero: React.FC<TrendingReposHeroProps> = ({ isDarkMode, onSelectRepo }) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingAIRepos().then(data => {
      setRepos(data);
      setLoading(false);
    });
  }, []);

  const displayRepos = expanded ? repos : repos.slice(0, 6);

  if (loading) return null;

  return (
    <div className={`rounded-2xl border p-8 mb-8 ${isDarkMode ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ✨ New AI Repositories
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Fresh AI/ML projects from the last 2 weeks • Updated daily
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isDarkMode 
              ? 'bg-purple-600 hover:bg-purple-500 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {expanded ? 'Show Less' : `Show All ${repos.length}`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayRepos.map((repo, idx) => (
          <div
            key={`${repo.owner}-${repo.repo}`}
            onClick={() => onSelectRepo(repo.owner, repo.repo)}
            className={`p-4 rounded-xl border cursor-pointer transition-all group animate-float-card ${
              isDarkMode
                ? 'bg-gray-800/50 border-white/10 hover:border-purple-500/50 hover:bg-gray-800 hover:scale-105'
                : 'bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg hover:scale-105'
            }`}
            style={{animationDelay: `${idx * 0.1}s`}}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 group-hover:text-purple-500 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {repo.owner}/{repo.repo}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {repo.language}
                  </span>
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ⭐ {(repo.stars / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-purple-500/30' : 'text-purple-300'}`}>
                #{idx + 1}
              </span>
            </div>
            <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {repo.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingReposHero;

// Add styles for floating animation
const styles = `
  @keyframes float-card {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  .animate-float-card {
    animation: float-card 3s ease-in-out infinite;
  }
  .animate-float-card:hover {
    animation-play-state: paused;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
