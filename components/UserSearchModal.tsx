import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { githubAuthService } from '../services/githubAuthService';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
  html_url: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo: (repoUrl: string) => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose, onSelectRepo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<GitHubUser | null>(null);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen]);

  const loadCurrentUser = async () => {
    if (githubAuthService.isAuthenticated()) {
      const user = await githubAuthService.getCurrentUser();
      setCurrentUser(user);
    }
  };

  const searchUsers = async (username: string) => {
    if (!username.trim()) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await githubAuthService.searchUsers(username);
      setUsers(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = async (user: GitHubUser) => {
    setSelectedUser(user);
    setIsLoadingRepos(true);
    
    try {
      const repos = await githubAuthService.getUserRepositories(user.login);
      setUserRepos(repos);
    } catch (error) {
      console.error('Error loading user repos:', error);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    onSelectRepo(repo.full_name);
    onClose();
  };

  const handleLogin = () => {
    githubAuthService.initiateLogin();
  };

  const handleLogout = () => {
    githubAuthService.logout();
    setCurrentUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Icon icon="user" className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Search GitHub Users</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <img src={currentUser.avatar_url} alt={currentUser.login} className="w-8 h-8 rounded-full" />
                <span className="text-sm text-gray-300">{currentUser.login}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Login with GitHub
              </button>
            )}
            
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <Icon icon="close" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-96">
          {/* Left Panel - User Search */}
          <div className="w-1/2 border-r border-white/10 p-6">
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search GitHub username..."
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-80">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.login}
                    onClick={() => selectUser(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedUser?.login === user.login
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{user.login}</div>
                      {user.name && <div className="text-sm text-gray-400 truncate">{user.name}</div>}
                      <div className="text-xs text-gray-500">{user.public_repos} repos</div>
                    </div>
                    {currentUser?.login === user.login && (
                      <div className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">You</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - User Repositories */}
          <div className="w-1/2 p-6">
            {selectedUser ? (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedUser.login}'s Repositories
                  </h3>
                  {!githubAuthService.isAuthenticated() && (
                    <p className="text-sm text-yellow-400 mb-3">
                      Login to see private repositories
                    </p>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-80">
                  {isLoadingRepos ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    userRepos.map((repo) => (
                      <button
                        key={repo.full_name}
                        onClick={() => handleRepoSelect(repo)}
                        className="w-full flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
                      >
                        <Icon icon="folder" className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white truncate">{repo.name}</span>
                            {repo.private && (
                              <Icon icon="lock" className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">{repo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Icon icon="star" className="w-3 h-3" />
                              {repo.stargazers_count}
                            </span>
                            <span>Updated {formatDate(repo.updated_at)}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Icon icon="user" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a user to view their repositories</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;