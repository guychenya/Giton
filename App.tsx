
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Example } from './types';
import ExampleCard from './components/ExampleCard';
import ExampleDetailModal from './components/ExampleDetailModal';
import PricingPage from './components/PricingPage';
import ArchitectureModal from './components/ArchitectureModal';
import PRDModal from './components/PRDModal';
import UnifiedSearch from './components/UnifiedSearch';
import UserDropdown from './components/UserDropdown';
import SavedProjectsModal from './components/SavedProjectsModal';
import ReportViewerModal from './components/ReportViewerModal';
import RepoSearchModal from './components/RepoSearchModal';
import UserSearchModal from './components/UserSearchModal';
import Icon from './components/Icon';
import Logo from './components/Logo';
import Assistant from './components/Assistant';
import VoiceAssistant from './components/VoiceAssistant';
import SettingsPage from './components/SettingsPage';
import { AppSettings } from './components/SettingsModal';
import { useAssistant, AssistantActions, Message } from './hooks/useAssistant';
import { fetchRepoData, RepoData, fetchSuggestedRepos, RepoGroup } from './utils/githubUtils';
import { geminiService } from './services/geminiService';
import { initializeLLMService, getLLMService } from './services/llmService';
import { db, SavedReport } from './utils/db'; 

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('giton-theme');
    return saved !== 'light';
  });
  const [examples, setExamples] = useState<Example[]>([]);
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const [selectedExampleContent, setSelectedExampleContent] = useState<string>('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  
  // Repo Management State - Default empty
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [repoContext, setRepoContext] = useState<string>('No repository loaded. Please enter a GitHub URL to start exploring.');
  
  // Modals State
  const [isRepoSearchModalOpen, setIsRepoSearchModalOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);
  const [isSavedProjectsModalOpen, setIsSavedProjectsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isPRDModalOpen, setIsPRDModalOpen] = useState(false);
  const [isReportViewerModalOpen, setIsReportViewerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  // Voice Assistant State
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | undefined>();

  // Architecture Diagram State
  const [architectureDiagram, setArchitectureDiagram] = useState('');
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);

  // PRD State
  const [prdContent, setPrdContent] = useState('');
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  
  // Report Viewer State
  const [reportViewerTitle, setReportViewerTitle] = useState('');
  const [reportViewerContent, setReportViewerContent] = useState('');
  const [reportViewerType, setReportViewerType] = useState<'guide' | 'chat'>('guide');

  // Suggestions State
  const [suggestions, setSuggestions] = useState<RepoGroup[]>([]);
  const [areSuggestionsLoading, setAreSuggestionsLoading] = useState(true);

  // Refs for State Access inside Callbacks (prevents stale closures in Assistant)
  const examplesRef = useRef<Example[]>([]);
  const repoDataRef = useRef<RepoData | null>(null);
  const categoriesRef = useRef<{name: string, count: number}[]>([]);

  // Cache for generated content to avoid re-fetching
  const generatedContentCache = useRef<Record<string, string>>({});
  const diagramCache = useRef<Record<string, string>>({});
  const prdCache = useRef<Record<string, string>>({});

  const detailContentRef = useRef<HTMLDivElement>(null);

  // Sync refs with state
  useEffect(() => {
      examplesRef.current = examples;
  }, [examples]);

  useEffect(() => {
      repoDataRef.current = repoData;
  }, [repoData]);

  // Load settings and suggestions on mount
  useEffect(() => {
    // Load settings
    const savedSettings = localStorage.getItem('giton-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setAppSettings(settings);
        initializeLLMService(settings);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    
    // Load suggestions
    const loadSuggestions = async () => {
        try {
            const data = await fetchSuggestedRepos();
            setSuggestions(data);
        } catch (error) {
            console.error("Error loading suggestions:", error);
        } finally {
            setAreSuggestionsLoading(false);
        }
    };
    loadSuggestions();
    
    // Command+K shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandKOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandKOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Categories logic with counts and hierarchy
  const categories = useMemo(() => {
    const counts: Record<string, number> = { 'All': examples.length };
    examples.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
    });

    const uniqueCategories: string[] = Array.from(new Set(examples.map(e => e.category)));
    
    // Define a logical hierarchy for ordering
    const priorityOrder = [
        'Core', 
        'Frontend', 
        'Backend', 
        'Database', 
        'Infrastructure', 
        'Tools', 
        'Config', 
        'Documentation'
    ];

    const sorted = uniqueCategories.sort((a, b) => {
        const idxA = priorityOrder.indexOf(a);
        const idxB = priorityOrder.indexOf(b);

        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const result = ['All', ...sorted].map(cat => ({ name: cat, count: counts[cat] || 0 }));
    categoriesRef.current = result; // Update ref
    return result;
  }, [examples]);

  // --- SAVE / PERSISTENCE LOGIC ---
  const handleSaveToProject = async (title: string, content: string, type: 'guide' | 'diagram' | 'prd' | 'chat') => {
      if (!repoData) {
          alert("No active repository loaded to save to.");
          return;
      }
      const projectId = `${repoData.owner}/${repoData.repo}`;
      const now = Date.now();
      
      const existingProject = await db.getProject(projectId);

      await db.saveProject({
          id: projectId,
          name: `${repoData.owner}/${repoData.repo}`,
          owner: repoData.owner,
          repo: repoData.repo,
          description: repoData.description,
          stars: repoData.stars,
          language: repoData.language,
          createdAt: existingProject ? existingProject.createdAt : now,
          updatedAt: now
      });

      await db.saveReport({
          id: `${projectId}-${type}-${now}`,
          projectId: projectId,
          title: title,
          type: type,
          content: content,
          createdAt: now
      });
  };

  const handleSaveChatToProject = async (messages: Message[]) => {
      if (!repoData) {
          alert("Load a repository before saving a chat.");
          return;
      }
      const formattedChat = messages.map(msg => `**${msg.role === 'user' ? 'You' : 'Assistant'}:**\n${msg.text}`).join('\n\n---\n\n');
      const chatTitle = `Chat Log - ${new Date().toLocaleString()}`;
      await handleSaveToProject(chatTitle, formattedChat, 'chat');
  };

  const handleOpenReportFromLibrary = (report: SavedReport) => {
      if (report.type === 'guide' || report.type === 'chat') {
          setReportViewerTitle(report.title);
          setReportViewerContent(report.content);
          setReportViewerType(report.type);
          setIsReportViewerModalOpen(true);
      } else if (report.type === 'diagram') {
          setArchitectureDiagram(report.content);
          setIsArchitectureModalOpen(true);
      } else if (report.type === 'prd') {
          setPrdContent(report.content);
          setIsPRDModalOpen(true);
      }
  };


  const handleCardClick = async (example: Example) => {
    setSelectedExample(example);
    setAssistantOpen(false);
    
    if (generatedContentCache.current[example.name]) {
      setSelectedExampleContent(generatedContentCache.current[example.name]);
      setIsGeneratingContent(false);
    } else {
      setIsGeneratingContent(true);
      setSelectedExampleContent('');
      try {
        const content = await geminiService.generateDetail(example.name, repoContext); 
        generatedContentCache.current[example.name] = content;
        setSelectedExampleContent(content);
      } catch (e) {
        setSelectedExampleContent('# Error\nFailed to generate content. Please try again.');
      } finally {
        setIsGeneratingContent(false);
      }
    }
  };

  const handleOpenArchitecture = async () => {
      if (!repoData) return;
      setIsArchitectureModalOpen(true);
      
      const repoKey = `${repoData.owner}/${repoData.repo}`;
      if (diagramCache.current[repoKey]) {
          setArchitectureDiagram(diagramCache.current[repoKey]);
          return;
      }

      setIsGeneratingDiagram(true);
      try {
          const diagram = await geminiService.generateArchitectureDiagram(repoContext); 
          diagramCache.current[repoKey] = diagram;
          setArchitectureDiagram(diagram);
      } catch (e) {
          console.error("Failed to generate diagram", e);
          setArchitectureDiagram(''); 
      } finally {
          setIsGeneratingDiagram(false);
      }
  };

  const handleOpenPRD = async () => {
      if (!repoData) return;
      setIsPRDModalOpen(true);

      const repoKey = `${repoData.owner}/${repoData.repo}`;
      if (prdCache.current[repoKey]) {
          setPrdContent(prdCache.current[repoKey]);
          return;
      }

      setIsGeneratingPRD(true);
      try {
          const content = await geminiService.generatePRD(repoContext); 
          prdCache.current[repoKey] = content;
          setPrdContent(content);
      } catch (e) {
          console.error("Failed to generate PRD", e);
          setPrdContent('# Error\nFailed to generate PRD.');
      } finally {
          setIsGeneratingPRD(false);
      }
  };

  const handleCloseModal = () => {
    setSelectedExample(null);
    setIsGeneratingContent(false);
  };
  
  const handleGoHome = () => {
    setSearchTerm('');
    setActiveCategory('All');
    setSelectedExample(null);
    setRepoUrl('');
    setRepoData(null);
    setExamples([]);
    setRepoError(null);
  };
  
  const loadRepo = async (url: string) => {
    if (!url) {
      setRepoError("Please provide a repository URL.");
      return;
    }

    setRepoUrl(url);
    setIsLoadingRepo(true);
    setLoadingProgress(0);
    setRepoError(null);
    setExamples([]);
    setRepoData(null);
    setArchitectureDiagram('');
    setPrdContent('');
    
    setTimeout(() => setLoadingProgress(10), 50);

    try {
        // Step 1: Fetch repo data from GitHub
        console.log("Fetching repo data...");
        const data = await fetchRepoData(url);
        setLoadingProgress(45);
        setRepoData(data);
        
        const context = `
          Repository: ${data.owner}/${data.repo}
          Description: ${data.description}
          Language: ${data.language}
          Topics: ${data.topics.join(', ')}
          
          README:
          ${data.readmeContent}
          
          File Structure:
          ${data.fileStructure}
        `;
        setRepoContext(context);
        setLoadingProgress(60);
        
        // Reset caches for the new repo
        generatedContentCache.current = {};
        diagramCache.current = {};
        prdCache.current = {};
        
        // Step 2: Analyze with Gemini
        console.log("Analyzing repository with Gemini...");
        setLoadingProgress(75);
        const newExamples = await geminiService.analyzeRepository(context);
        
        setLoadingProgress(100);
        setExamples(newExamples);
        setActiveCategory('All');
    } catch (err: any) {
        console.error("Error during loadRepo process:", err);
        setRepoError(err.message || "An unknown error occurred.");
        setRepoContext('Error loading repository. Please try again.');
        setLoadingProgress(0);
    } finally {
        setIsLoadingRepo(false);
        setTimeout(() => setLoadingProgress(0), 500);
    }
  };


  const handleSelectRepoFromSearch = (url: string) => {
      setIsRepoSearchModalOpen(false);
      loadRepo(url);
  };

  const handleAnalyzeRepo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoUrl.trim()) return;
    loadRepo(repoUrl);
  };

  const filteredExamples = useMemo(() => {
    return examples.filter(example => {
      const matchesCategory = activeCategory === 'All' || example.category === activeCategory;
      const matchesSearch =
        !searchTerm ||
        example.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        example.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, examples, activeCategory]);
  
  const scrollToSectionInDetails = (sectionId: string) => {
    if (detailContentRef.current) {
        const sectionElement = detailContentRef.current.querySelector(`#${sectionId}`);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.warn(`Could not find section with ID: ${sectionId}`);
        }
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('All');
  };
  
  const formatStars = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const assistantActions: AssistantActions = useMemo(() => ({
    filterByCategory: (category: string) => {
      const foundCategory = categoriesRef.current.find(c => c.name.toLowerCase() === category.toLowerCase());
      if (foundCategory) {
        setActiveCategory(foundCategory.name);
        return `Filtered by category: ${foundCategory.name}`;
      }
      return `Category '${category}' not found. Available categories: ${categoriesRef.current.map(c => c.name).join(', ')}`;
    },
    searchExamples: (term: string) => {
      setSearchTerm(term);
      return `Searching for "${term}"`;
    },
    showExampleDetails: (name: string) => {
      if (examplesRef.current.length === 0) {
          return "I cannot open that yet because the repository analysis is still in progress. Please wait a few seconds.";
      }
      
      const example = examplesRef.current.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
      if (example) {
        handleCardClick(example);
        return `Opened details for: ${example.name}`;
      } else {
          return `I couldn't find a card named "${name}". Available cards are: ${examplesRef.current.slice(0, 5).map(e => e.name).join(', ')}...`;
      }
    },
    closeDetails: () => {
        handleCloseModal();
        setIsReportViewerModalOpen(false);
        return "Closed the details view.";
    },
    closeAssistant: () => {
      setAssistantOpen(false);
      return "Assistant closed.";
    },
    scrollToSectionInDetails: (sectionId) => {
        scrollToSectionInDetails(sectionId);
        return "Scrolled to section.";
    },
    resetFilters: () => {
        resetFilters();
        return "Filters reset.";
    },
    performGoogleSearch: async (query: string) => {
        return await geminiService.performWebSearch(query); 
    },
    searchGitHub: async (query: string) => {
        try {
          const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=10`);
          if (!response.ok) return 'GitHub search failed. Please try again.';
          
          const data = await response.json();
          if (!data.items || data.items.length === 0) return `No repositories found for "${query}".`;
          
          const results = data.items.slice(0, 10).map((repo: any) => 
            `**${repo.full_name}** (⭐ ${repo.stargazers_count.toLocaleString()})\n${repo.description || 'No description'}\nLanguage: ${repo.language || 'N/A'}`
          ).join('\n\n');
          
          return `Found ${data.total_count.toLocaleString()} repositories for "${query}". Here are the top results:\n\n${results}`;
        } catch (error) {
          return 'Error searching GitHub. Please try again.';
        }
    },
  }), [handleCardClick, handleCloseModal]); // Dependencies for useMemo

  const {
    messages,
    isTextLoading,
    voiceStatus,
    error,
    liveTranscript,
    streamingModelResponse,
    initialize,
    sendTextMessage,
    startVoiceInteraction,
    stopVoiceInteraction,
    clearChat,
  } = useAssistant(assistantActions, repoContext); 

  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize, repoContext]); 

  const handleToggleVoiceAssistant = () => {
    if (voiceStatus === 'listening') {
      stopVoiceInteraction();
    } else {
      setAssistantOpen(true);
      startVoiceInteraction();
    }
  };

  const handleVoiceDiscussion = (example: Example) => {
      setAssistantOpen(true);
      setTimeout(() => {
          startVoiceInteraction();
      }, 100);
  };
  
  useEffect(() => {
    if (!isAssistantOpen && voiceStatus === 'listening') {
      stopVoiceInteraction();
    }
  }, [isAssistantOpen, voiceStatus, stopVoiceInteraction]);

  const handleAskAssistant = (question: string) => {
    setAssistantOpen(true);
    setTimeout(() => {
      setUserInput(question);
    }, 100);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('giton-theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  return (
    <div className={`relative h-screen w-full flex overflow-hidden font-sans ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      
      <Assistant 
        isOpen={isAssistantOpen}
        onToggle={() => setAssistantOpen(!isAssistantOpen)}
        messages={messages}
        isTextLoading={isTextLoading}
        voiceStatus={voiceStatus}
        error={error}
        liveTranscript={liveTranscript}
        streamingModelResponse={streamingModelResponse}
        userInput={userInput}
        setUserInput={setUserInput}
        sendTextMessage={sendTextMessage}
        startVoiceInteraction={handleToggleVoiceAssistant} 
        stopVoiceInteraction={stopVoiceInteraction}
        clearChat={clearChat}
        onSaveChat={handleSaveChatToProject}
        isDarkMode={isDarkMode}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Clean Navbar */}
        <nav className={`relative z-20 border-b backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-gray-900/80' : 'border-gray-200 bg-white/80'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <Logo onClick={handleGoHome} />
                {repoData && (
                  <div className="hidden md:flex items-center gap-3 text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Analyzing:</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{repoData.owner}/{repoData.repo}</span>
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Icon icon="star" className="w-3 h-3" /> {formatStars(repoData.stars)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleTheme}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  title="Toggle theme"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isDarkMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    )}
                  </svg>
                </button>
                
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  Pricing
                </button>
                
                <button 
                  onClick={() => setIsSavedProjectsModalOpen(true)}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  title="Projects"
                >
                  <Icon icon="folder-open" className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  title="Settings"
                >
                  <Icon icon="settings" className="w-5 h-5" />
                </button>
                
                <button className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  D
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10 flex flex-col items-center flex-1 overflow-y-auto">
          {/* Hero Section */}
          {!repoData && examples.length === 0 && (
            <div className="w-full max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
              <h1 className={`text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-purple-400 via-pink-500 to-blue-400' : 'from-purple-600 via-pink-600 to-blue-600'} mb-6`}>
                GitOn
              </h1>
              <p className={`text-xl mb-12 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                AI-powered GitHub repository analysis. Get instant documentation, examples, and insights.
              </p>
              
              <div className="max-w-3xl mx-auto mb-16">
                <UnifiedSearch 
                  onSelectRepo={(repoPath) => loadRepo(repoPath)}
                  placeholder="Search by username, repo name, or paste URL..."
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          )}

          {/* Active Repo Header */}
          {repoData && examples.length > 0 && (
            <div className={`w-full border-b backdrop-blur-sm ${isDarkMode ? 'border-white/10 bg-gray-800/30' : 'border-gray-200 bg-white/50'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{repoData.owner}/{repoData.repo}</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{repoData.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleOpenArchitecture}
                      className="px-4 py-2 text-sm font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Icon icon="backend" className="w-4 h-4" />
                      Architecture
                    </button>
                    <button 
                      onClick={handleOpenPRD}
                      className="px-4 py-2 text-sm font-medium bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Icon icon="document" className="w-4 h-4" />
                      PRD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {repoError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-8 max-w-2xl w-full text-center">
                  Error: {repoError}
              </div>
          )}


          
          {/* Category Filters */}
          {examples.length > 0 && categories.length > 1 && (
            <div className={`w-full border-b ${isDarkMode ? 'border-white/10 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                        ${activeCategory === category.name
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                    >
                      {category.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeCategory === category.name 
                           ? 'bg-white/20 text-white' 
                           : 'bg-white/10 text-gray-400'
                      }`}>
                          {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoadingRepo ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-8">
                {/* Animated Logo/Icon */}
                <div className="relative w-32 h-32">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                  
                  {/* Water fill effect */}
                  <div className="absolute inset-2 rounded-full overflow-hidden bg-gray-800">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 via-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                      style={{ height: `${loadingProgress}%` }}
                    >
                      {/* Wave animation */}
                      <div className="absolute top-0 left-0 right-0 h-3 opacity-50">
                        <div className="absolute inset-0 bg-white/20 animate-wave"></div>
                      </div>
                    </div>
                    
                    {/* GitOn icon/text in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white z-10">G</span>
                    </div>
                  </div>
                  
                  {/* Progress percentage */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-purple-400 font-semibold">
                    {loadingProgress}%
                  </div>
                </div>

                {/* Progress stages */}
                <div className="space-y-4 w-full max-w-md">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      loadingProgress >= 10 ? 'bg-green-500' : 'bg-gray-600'
                    }`}></div>
                    <span className={`text-sm transition-colors ${
                      loadingProgress >= 10 ? (isDarkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'
                    }`}>Connecting to GitHub...</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      loadingProgress >= 45 ? 'bg-green-500' : loadingProgress >= 10 ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
                    }`}></div>
                    <span className={`text-sm transition-colors ${
                      loadingProgress >= 45 ? (isDarkMode ? 'text-white' : 'text-gray-900') : loadingProgress >= 10 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>Fetching repository data...</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      loadingProgress >= 75 ? 'bg-green-500' : loadingProgress >= 45 ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
                    }`}></div>
                    <span className={`text-sm transition-colors ${
                      loadingProgress >= 75 ? (isDarkMode ? 'text-white' : 'text-gray-900') : loadingProgress >= 45 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>Analyzing with AI...</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      loadingProgress >= 100 ? 'bg-green-500' : loadingProgress >= 75 ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
                    }`}></div>
                    <span className={`text-sm transition-colors ${
                      loadingProgress >= 100 ? (isDarkMode ? 'text-white' : 'text-gray-900') : loadingProgress >= 75 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>Generating insights...</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : filteredExamples.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredExamples.map((example, index) => (
                  <div key={example.name + index} className="animate-card-in" style={{ animationDelay: `${index * 50}ms`}}>
                    <ExampleCard
                      {...example}
                      onClick={() => handleCardClick(example)}
                      onVoiceChat={() => handleVoiceDiscussion(example)}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                ))}
              </div>
            ) : !repoData ? (
              <div className="text-center py-12">
                <h3 className={`text-xl font-semibold mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Popular Repositories</h3>
                {areSuggestionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-40 bg-white/5 rounded-lg border border-white/10"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {suggestions.map((group) => (
                      <div key={group.category} className="flex flex-col gap-3">
                        <h4 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{group.category}</h4>
                        {group.items.map(repo => (
                          <button 
                            key={repo.repo}
                            onClick={() => loadRepo(`${repo.owner}/${repo.repo}`)}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-all text-left group ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-500/50' : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-purple-500/50'}`}
                          >
                            <div className="flex flex-col overflow-hidden mr-2">
                              <span className={`text-sm font-medium group-hover:text-purple-600 transition-colors truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {repo.owner}/<span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{repo.repo}</span>
                              </span>
                              <span className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{repo.description?.substring(0, 50)}...</span>
                            </div>
                            <span className="text-xs text-yellow-400 flex-shrink-0 flex items-center gap-1">
                              <Icon icon="star" className="w-3 h-3" /> {formatStars(repo.stars)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <footer className={`mt-auto pt-8 text-center text-sm max-w-4xl mx-auto space-y-2 pb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            <p className={`text-xs mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               Made with ❤️ by <a href="https://www.linkedin.com/in/guychenya/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">Guy Chenya</a> for Training purposes.
            </p>
          </footer>
        </main>
      </div>

      {selectedExample && (
        <ExampleDetailModal
          example={selectedExample}
          content={selectedExampleContent}
          isLoading={isGeneratingContent}
          onClose={handleCloseModal}
          contentRef={detailContentRef}
          onAskAssistant={handleAskAssistant}
          onSave={handleSaveToProject}
          repoUrl={`https://github.com/${repoData?.owner}/${repoData?.repo}`}
          isDarkMode={isDarkMode}
        />
      )}

      <RepoSearchModal
          isOpen={isRepoSearchModalOpen}
          onClose={() => setIsRepoSearchModalOpen(false)}
          onSelectRepo={handleSelectRepoFromSearch}
      />
      
      <UserSearchModal
          isOpen={isUserSearchModalOpen}
          onClose={() => setIsUserSearchModalOpen(false)}
          onSelectRepo={handleSelectRepoFromSearch}
      />

      <ArchitectureModal 
          isOpen={isArchitectureModalOpen}
          onClose={() => setIsArchitectureModalOpen(false)}
          diagramCode={architectureDiagram}
          isLoading={isGeneratingDiagram}
          onSave={handleSaveToProject}
      />

      <PRDModal
          isOpen={isPRDModalOpen}
          onClose={() => setIsPRDModalOpen(false)}
          content={prdContent}
          isLoading={isGeneratingPRD}
          onSave={handleSaveToProject}
      />

      <SavedProjectsModal 
          isOpen={isSavedProjectsModalOpen}
          onClose={() => setIsSavedProjectsModalOpen(false)}
          onOpenReport={handleOpenReportFromLibrary}
          onLoadProject={loadRepo}
      />
      
      <ReportViewerModal 
        isOpen={isReportViewerModalOpen}
        onClose={() => setIsReportViewerModalOpen(false)}
        title={reportViewerTitle}
        content={reportViewerContent}
        reportType={reportViewerType}
        onSave={(title, content, type) => handleSaveToProject(title, content, type as 'guide' | 'chat')}
      />
      
      {isPricingModalOpen && (
        <PricingPage
          isDarkMode={isDarkMode}
          onClose={() => setIsPricingModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsPage
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={(settings) => {
            setAppSettings(settings);
            initializeLLMService(settings);
            geminiService.reinitialize();
            setIsSettingsModalOpen(false);
          }}
        />
      )}
      
      {/* Command+K Search Modal */}
      {isCommandKOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-start justify-center pt-32 px-4 animate-fade-in"
          onClick={() => setIsCommandKOpen(false)}
        >
          <div 
            className={`w-full max-w-2xl backdrop-blur-xl border rounded-2xl shadow-2xl animate-zoom-out ${isDarkMode ? 'bg-gray-900/95 border-white/20' : 'bg-white/95 border-gray-300'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Search</h2>
                <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">⌘K</kbd>
                  <span>to open</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">ESC</kbd>
                  <span>to close</span>
                </div>
              </div>
              
              <UnifiedSearch 
                onSelectRepo={(repoPath) => {
                  setIsCommandKOpen(false);
                  loadRepo(repoPath);
                }}
                placeholder="Search by username, repo name, or paste URL..."
                autoFocus={true}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      )}



       <style>
        {`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
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
          @keyframes card-in {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-card-in {
            animation: card-in 0.4s ease-out backwards;
          }
          @keyframes wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-wave {
            animation: wave 2s linear infinite;
          }
          @keyframes zoom-out {
            from {
              opacity: 0;
              transform: scale(0.3) translateY(-200px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-zoom-out {
            animation: zoom-out 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}
       </style>
    </div>
  );
};

export default App;
