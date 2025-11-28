

import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { searchRepositories, SuggestedRepo } from '../utils/githubUtils';
import LoadingSpinner from './LoadingSpinner';

interface RepoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo: (repoUrl: string) => void;
}

const RepoSearchModal: React.FC<RepoSearchModalProps> = ({ isOpen, onClose, onSelectRepo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [copiedCloneUrl, setCopiedCloneUrl] = useState<string | null>(null); // To show feedback for which repo was copied


  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [perPage] = useState(10); // Results per page

  useEffect(() => {
    if (isOpen) {
        // Focus input when modal opens
        setTimeout(() => inputRef.current?.focus(), 100);
        setQuery('');
        setResults([]);
        setError(null);
        setCopiedCloneUrl(null);
        setCurrentPage(1);
        setTotalResults(0);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentPage(1);
    setCopiedCloneUrl(null); // Clear copy status on new search

    try {
        const data = await searchRepositories(query, 1, perPage);
        if (data && Array.isArray(data.items)) {
            setResults(data.items);
            setTotalResults(data.total_count);
            if (data.items.length === 0) {
                setError('No repositories found matching your query.');
            }
        } else {
            setError('Received an unexpected response from the server.');
            setResults([]);
            setTotalResults(0);
        }
    } catch (err: any) {
        setError(err.message || 'Failed to search repositories.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (results.length >= totalResults || isLoading) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;
    try {
      const data = await searchRepositories(query, nextPage, perPage);
      setResults(prev => [...prev, ...data.items]);
      setCurrentPage(nextPage);
    } catch (err: any) {
      setError(err.message || 'Failed to load more results.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current === event.target) onClose();
  };

  const formatStars = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const handleCopyCloneUrl = (owner: string, repo: string) => {
    const cloneUrl = `https://github.com/${owner}/${repo}.git`;
    navigator.clipboard.writeText(`git clone ${cloneUrl}`).then(() => {
      setCopiedCloneUrl(`${owner}/${repo}`);
      setTimeout(() => setCopiedCloneUrl(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-[70] p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[80vh] animate-scale-in mt-10 sm:mt-0">
        
        {/* Header & Search Input */}
        <div className="p-4 border-b border-white/10 bg-gray-800/50">
           <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Icon icon="search" className="w-5 h-5 text-purple-400" />
                    Search GitHub
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <Icon icon="close" className="w-6 h-6" />
                </button>
           </div>
           
           <form onSubmit={handleSearch} className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a repository (e.g. 'react', 'tensorflow')..."
                    className="w-full bg-black/30 border border-white/20 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <button 
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                    <Icon icon="search" className="w-5 h-5" />
                </button>
           </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[200px]">
            {isLoading && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                    <p className="text-gray-400">{error}</p>
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-2">
                    {results.map((repo) => (
                        <div
                            key={`${repo.owner}/${repo.repo}`}
                            className="w-full text-left p-4 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl transition-all group relative"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-purple-300 group-hover:text-purple-200 truncate">
                                        {repo.owner} / <span className="text-white">{repo.repo}</span>
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{repo.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        {repo.language && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                {repo.language}
                                            </span>
                                        )}
                                        <span>Updated {new Date(repo.updatedAt || '').toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                    <button 
                                        onClick={() => handleCopyCloneUrl(repo.owner, repo.repo)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Copy Git Clone URL"
                                    >
                                        {copiedCloneUrl === `${repo.owner}/${repo.repo}` ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="git" className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => onSelectRepo(`${repo.owner}/${repo.repo}`)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {results.length < totalResults && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
                            >
                                {isLoading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                    <p>Type a name and press Enter to search.</p>
                </div>
            )}
        </div>
      </div>
      <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.3); }
            @keyframes scale-in {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in {
                animation: scale-in 0.2s ease-out forwards;
            }
      `}</style>
    </div>
  );
};

export default RepoSearchModal;