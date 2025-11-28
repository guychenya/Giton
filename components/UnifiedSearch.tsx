import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { githubAuthService } from '../services/githubAuthService';

interface SearchResult {
  type: 'user' | 'repo' | 'url';
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  data: any;
}

interface UnifiedSearchProps {
  onSelectRepo: (repoUrl: string) => void;
  placeholder?: string;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ 
  onSelectRepo, 
  placeholder = "Search repos, users, or paste GitHub URL..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
        const urlMatch = searchQuery.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
        if (urlMatch) {
          searchResults.push({
            type: 'url',
            id: `${urlMatch[1]}/${urlMatch[2]}`,
            title: `${urlMatch[1]}/${urlMatch[2]}`,
            subtitle: 'GitHub Repository URL',
            data: { url: searchQuery }
          });
        }
      }

      // Search users
      const users = await githubAuthService.searchUsers(searchQuery);
      users.slice(0, 5).forEach(user => {
        searchResults.push({
          type: 'user',
          id: user.login,
          title: user.login,
          subtitle: user.name || `${user.public_repos} public repos`,
          avatar: user.avatar_url,
          data: user
        });
      });

      // Search repositories (using GitHub search API)
      const repoResponse = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&per_page=10`);
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        repoData.items?.slice(0, 5).forEach((repo: any) => {
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
    if (result.type === 'url' || result.type === 'repo') {
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
      case 'url': return 'external-link';
      default: return 'search';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <Icon icon="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.trim() || selectedUser) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {selectedUser ? (
            // User's repositories
            <div>
              <div className="p-3 border-b border-white/10 bg-blue-600/10">
                <div className="flex items-center gap-3">
                  <img src={selectedUser.avatar_url} alt={selectedUser.login} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-medium text-white">{selectedUser.login}</div>
                    <div className="text-xs text-gray-400">Select a repository</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setQuery('');
                    }}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    <Icon icon="close" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {isLoadingRepos ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  userRepos.map((repo) => (
                    <button
                      key={repo.full_name}
                      onClick={() => handleRepoSelect(repo)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <Icon icon="folder" className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">{repo.name}</span>
                          {repo.private && <Icon icon="lock" className="w-3 h-3 text-yellow-400" />}
                        </div>
                        {repo.description && (
                          <div className="text-sm text-gray-400 truncate">{repo.description}</div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {repo.language && <span>{repo.language}</span>}
                          <span className="flex items-center gap-1">
                            <Icon icon="star" className="w-3 h-3" />
                            {repo.stargazers_count}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Search results
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && !isSearching && query.trim() && (
                <div className="p-4 text-center text-gray-400">
                  No results found. Try a different search term.
                </div>
              )}
              
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                >
                  {result.avatar ? (
                    <img src={result.avatar} alt={result.title} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <Icon icon={getResultIcon(result.type)} className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{result.title}</div>
                    <div className="text-sm text-gray-400 truncate">{result.subtitle}</div>
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{result.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedSearch;