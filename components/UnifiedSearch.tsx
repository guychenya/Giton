import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { githubAuthService } from '../services/githubAuthService';

interface SearchResult {
  type: 'user' | 'repo' | 'url' | 'topic';
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  data: any;
}

interface UnifiedSearchProps {
  onSelectRepo: (repoUrl: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  isDarkMode?: boolean;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ 
  onSelectRepo, 
  placeholder = "Search users, repos, topics, or paste URL...",
  autoFocus = false,
  isDarkMode = true
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchEverything = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Check if it's a GitHub URL
      if (searchQuery.includes('github.com/')) {
        const urlMatch = searchQuery.match(/github\.com\/([^\/\s]+)\/([^\/\s?#]+)/);
        if (urlMatch) {
          const owner = urlMatch[1];
          const repo = urlMatch[2];
          searchResults.push({
            type: 'url',
            id: `${owner}/${repo}`,
            title: `${owner}/${repo}`,
            subtitle: 'GitHub Repository URL',
            data: { url: searchQuery, full_name: `${owner}/${repo}` }
          });
        }
      }

      // Check if it's a username-only (no spaces, no special chars)
      const isLikelyUsername = /^[a-zA-Z0-9-]+$/.test(searchQuery);
      
      if (isLikelyUsername) {
        // Try to fetch user directly
        try {
          const userResponse = await fetch(`https://api.github.com/users/${searchQuery}`);
          if (userResponse.ok) {
            const user = await userResponse.json();
            // Auto-expand this user's repos
            setSelectedUser(user);
            setIsLoadingRepos(true);
            const repos = await githubAuthService.getUserRepositories(user.login);
            setUserRepos(repos);
            setIsLoadingRepos(false);
            setIsSearching(false);
            return;
          }
        } catch (e) {
          // Not a valid username, continue with normal search
        }
      }

      // Search users
      const users = await githubAuthService.searchUsers(searchQuery);
      users.slice(0, 3).forEach(user => {
        searchResults.push({
          type: 'user',
          id: user.login,
          title: user.login,
          subtitle: user.name || `${user.public_repos} public repos`,
          avatar: user.avatar_url,
          data: user
        });
      });

      // Search repositories by name/description
      const repoResponse = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&per_page=15`);
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        repoData.items?.slice(0, 15).forEach((repo: any) => {
          searchResults.push({
            type: 'repo',
            id: repo.full_name,
            title: repo.name,
            subtitle: `${repo.owner.login} • ${repo.description?.substring(0, 60) || 'No description'}`,
            avatar: repo.owner.avatar_url,
            data: repo
          });
        });
      }

      // Search by topic if query looks like a topic (single word or hyphenated)
      if (/^[a-z0-9-]+$/i.test(searchQuery)) {
        const topicResponse = await fetch(`https://api.github.com/search/repositories?q=topic:${encodeURIComponent(searchQuery)}&sort=stars&per_page=10`);
        if (topicResponse.ok) {
          const topicData = await topicResponse.json();
          topicData.items?.slice(0, 10).forEach((repo: any) => {
            // Avoid duplicates
            if (!searchResults.find(r => r.id === repo.full_name)) {
              searchResults.push({
                type: 'topic',
                id: repo.full_name,
                title: repo.name,
                subtitle: `Topic: ${searchQuery} • ${repo.description?.substring(0, 50) || 'No description'}`,
                avatar: repo.owner.avatar_url,
                data: repo
              });
            }
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowResults(true);
    setSelectedUser(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchEverything(value);
    }, 300);
  };

  const handleResultClick = async (result: SearchResult) => {
    if (result.type === 'url' || result.type === 'repo' || result.type === 'topic') {
      const repoPath = result.type === 'url' 
        ? result.id 
        : result.data.full_name;
      onSelectRepo(repoPath);
      setShowResults(false);
      setQuery('');
    } else if (result.type === 'user') {
      setSelectedUser(result.data);
      setIsLoadingRepos(true);
      setQuery(`${result.data.login} - `);
      
      try {
        const repos = await githubAuthService.getUserRepositories(result.data.login);
        setUserRepos(repos);
      } catch (error) {
        console.error('Error loading user repos:', error);
      } finally {
        setIsLoadingRepos(false);
      }
    }
  };

  const handleRepoSelect = (repo: any) => {
    onSelectRepo(repo.full_name);
    setShowResults(false);
    setQuery('');
    setSelectedUser(null);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user': return 'user';
      case 'repo': return 'folder';
      case 'topic': return 'tag';
      case 'url': return 'external-link';
      default: return 'search';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className={`w-full border rounded-full px-6 py-4 pl-14 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-lg shadow-lg ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        />
        <Icon icon="search" className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results - Enlarged */}
      {showResults && (query.trim() || selectedUser) && (
        <div className={`absolute top-full left-0 right-0 mt-4 backdrop-blur-xl border rounded-2xl shadow-2xl z-50 max-h-[600px] overflow-hidden animate-scale-in ${isDarkMode ? 'bg-gray-900/98 border-white/20' : 'bg-white/98 border-gray-300'}`}>
          {selectedUser ? (
            // User's repositories - Enlarged
            <div>
              <div className={`p-6 border-b ${isDarkMode ? 'border-white/10 bg-gradient-to-r from-purple-600/10 to-blue-600/10' : 'border-gray-200 bg-gradient-to-r from-purple-100 to-blue-100'}`}>
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar_url} alt={selectedUser.login} className="w-12 h-12 rounded-full border-2 border-purple-500/30" />
                  <div className="flex-1">
                    <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.login}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userRepos.length} repositories</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setQuery('');
                    }}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    <Icon icon="close" className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto p-2">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {userRepos.map((repo) => (
                      <button
                        key={repo.full_name}
                        onClick={() => handleRepoSelect(repo)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left border border-transparent hover:border-purple-500/30 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                      >
                        <Icon icon="folder" className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{repo.name}</span>
                            {repo.private && <Icon icon="lock" className="w-4 h-4 text-yellow-400" />}
                          </div>
                          {repo.description && (
                            <div className={`text-sm line-clamp-2 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{repo.description}</div>
                          )}
                          <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Icon icon="star" className="w-3 h-3 text-yellow-400" />
                              {repo.stargazers_count}
                            </span>
                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Search results - Enlarged
            <div className="max-h-[500px] overflow-y-auto p-2">
              {results.length === 0 && !isSearching && query.trim() && (
                <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Icon icon="search" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results found. Try a different search term.</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border border-transparent hover:border-purple-500/30 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  >
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.title} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <Icon icon={getResultIcon(result.type)} className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{result.title}</div>
                      <div className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.subtitle}</div>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded capitalize ${
                      result.type === 'user' ? 'bg-blue-600/20 text-blue-300' :
                      result.type === 'topic' ? 'bg-green-600/20 text-green-300' :
                      result.type === 'url' ? 'bg-orange-600/20 text-orange-300' :
                      'bg-purple-600/20 text-purple-300'
                    }`}>{result.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;
