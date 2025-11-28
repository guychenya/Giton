
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Example } from './types';
import ExampleCard from './components/ExampleCard';
import ExampleDetailModal from './components/ExampleDetailModal';
import ArchitectureModal from './components/ArchitectureModal';
import PRDModal from './components/PRDModal';
import RepoSearchModal from './components/RepoSearchModal';
import SavedProjectsModal from './components/SavedProjectsModal';
import ReportViewerModal from './components/ReportViewerModal';
import Icon from './components/Icon';
import Logo from './components/Logo';
import Assistant from './components/Assistant';
import SettingsModal, { AppSettings } from './components/SettingsModal';
import { useAssistant, AssistantActions, Message } from './hooks/useAssistant';
import { fetchRepoData, RepoData, fetchSuggestedRepos, RepoGroup } from './utils/githubUtils';
import { geminiService } from './services/geminiService';
import { initializeLLMService, getLLMService } from './services/llmService';
import { db, SavedReport } from './utils/db'; 

const App: React.FC = () => {
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
  const [isSavedProjectsModalOpen, setIsSavedProjectsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isPRDModalOpen, setIsPRDModalOpen] = useState(false);
  const [isReportViewerModalOpen, setIsReportViewerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

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

  return (
    <div className="relative h-screen w-full flex overflow-hidden bg-gray-900 text-white font-sans">
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
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="relative z-10 flex flex-col items-center flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="w-full flex items-center justify-between mb-8 max-w-6xl">
             <div className="flex items-center gap-4">
                <Logo onClick={handleGoHome} />
                <button 
                  onClick={() => setIsSavedProjectsModalOpen(true)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-blue-300 hover:text-white transition-colors"
                  title="Saved Projects Library"
                >
                  <Icon icon="library" className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-gray-300 hover:text-white transition-colors"
                  title="Settings"
                >
                  <Icon icon="settings" className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={handleAnalyzeRepo} className="flex-1 max-w-md ml-4 flex gap-2">
                <input 
                    type="text" 
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="owner/repo (e.g. facebook/react)"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500"
                />
                
                <button 
                    type="button"
                    onClick={() => setIsRepoSearchModalOpen(true)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-gray-300 hover:text-white transition-colors"
                    title="Search for a repository"
                >
                    <Icon icon="search" className="w-4 h-4" />
                </button>

                <button 
                    type="submit"
                    disabled={isLoadingRepo}
                    className="relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-100 flex items-center gap-2 transition-all min-w-[100px] justify-center group"
                >
                    {isLoadingRepo && (
                        <div 
                            className="absolute inset-y-0 left-0 bg-purple-600/50 transition-all duration-500 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    )}
                    
                    <span className="relative z-10 flex items-center gap-2">
                        {isLoadingRepo ? <span className="animate-spin">⟳</span> : null}
                        {isLoadingRepo ? 'Loading' : 'Load'}
                    </span>
                </button>
             </form>
          </div>

          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400">
              GitOn
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
              {repoData 
                  ? `Exploring ${repoData.owner}/${repoData.repo}: ${repoData.description}` 
                  : "Instant documentation, examples, and interactive analysis for any public GitHub repository."}
            </p>
            {repoData && (
                <div className="mt-4 flex gap-4 justify-center text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Icon icon="star" className="w-4 h-4 text-yellow-400" /> {repoData.stars.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {repoData.language}</span>
                    {repoData.topics.length > 0 && (
                         <div className="hidden sm:flex items-center gap-2 border-l border-gray-700 pl-4">
                             {repoData.topics.slice(0, 3).map(t => (
                                 <span key={t} className="bg-white/5 px-2 py-0.5 rounded-full text-xs">{t}</span>
                             ))}
                         </div>
                    )}
                </div>
            )}
          </header>
          
          {repoError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-8 max-w-2xl w-full text-center">
                  Error: {repoError}
              </div>
          )}

          {examples.length > 0 && (
            <div className="w-full max-w-xl mb-6">
                <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                    <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter results..."
                    className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow duration-300"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true">
                    <Icon icon="search" className="w-6 h-6 text-gray-400" />
                    </div>
                </div>
                <button
                    onClick={handleToggleVoiceAssistant}
                    className={`flex-shrink-0 p-3 text-white transition-all duration-300 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400 ${voiceStatus === 'listening' ? 'ring-2 ring-purple-500 animate-pulse' : ''}`}
                >
                    <Icon icon={voiceStatus === 'listening' ? "stop" : "microphone"} className="w-6 h-6" />
                </button>
                </div>
            </div>
          )}
          
          {examples.length > 0 && categories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 animate-fade-in">
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center gap-2
                        ${activeCategory === category.name
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        }`}
                    >
                      {category.name}
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md transition-colors ${
                          activeCategory === category.name 
                           ? 'bg-white/20 text-white' 
                           : 'bg-white/10 text-gray-400 group-hover:bg-white/20'
                      }`}>
                          {category.count}
                      </span>
                    </button>
                  ))}
                  
                  <button 
                    onClick={handleOpenArchitecture}
                    className="px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center gap-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30"
                  >
                     <Icon icon="backend" className="w-4 h-4" />
                     System Design
                  </button>

                  <button 
                    onClick={handleOpenPRD}
                    className="px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center gap-2 bg-teal-900/40 hover:bg-teal-800/60 text-teal-200 border border-teal-500/30"
                  >
                     <Icon icon="document" className="w-4 h-4" />
                     PRD
                  </button>
              </div>
          )}

          {isLoadingRepo ? (
             <div className="w-full h-64 flex flex-col items-center justify-center space-y-4">
                 <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-xl text-gray-300 animate-pulse">Analyzing repository structure...</p>
                 <p className="text-sm text-gray-500">This might take a few seconds depending on the size</p>
             </div>
          ) : filteredExamples.length > 0 ? (
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-20">
              {filteredExamples.map((example, index) => (
                <div key={example.name + index} className="animate-card-in" style={{ animationDelay: `${index * 50}ms`}}>
                  <ExampleCard
                    {...example}
                    onClick={() => handleCardClick(example)}
                    onVoiceChat={() => handleVoiceDiscussion(example)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8 px-4 w-full max-w-4xl">
              <button 
                onClick={() => setIsRepoSearchModalOpen(true)}
                className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/10 hover:bg-white/20 hover:scale-110 transition-all cursor-pointer group shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                aria-label="Search repositories"
              >
                 <Icon icon="search" className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </button>
              <h2 className="text-2xl font-bold text-gray-200 mb-2">Start Your Exploration</h2>
              <p className="text-gray-400 max-w-md mb-10">
                Click the icon above to search, or enter a GitHub URL directly. Try one of these popular repositories:
              </p>
              
              {areSuggestionsLoading ? (
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                      {[1, 2, 3].map(i => (
                          <div key={i} className="h-40 bg-white/5 rounded-lg border border-white/10"></div>
                      ))}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                      {suggestions.map((group) => (
                          <div key={group.category} className="flex flex-col gap-3">
                              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-left pl-1">{group.category}</h3>
                              {group.items.map(repo => (
                                  <button 
                                    key={repo.repo}
                                    onClick={() => loadRepo(`${repo.owner}/${repo.repo}`)}
                                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg transition-all text-left group"
                                    title={repo.description}
                                  >
                                      <div className="flex flex-col overflow-hidden mr-2">
                                          <span className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                                              {repo.owner}/<span className="text-white font-bold">{repo.repo}</span>
                                          </span>
                                          <span className="text-[10px] text-gray-500 truncate">{repo.description?.substring(0, 40)}...</span>
                                      </div>
                                      <span className="text-xs text-yellow-500 flex-shrink-0 flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded">
                                          <Icon icon="star" className="w-3 h-3" /> {formatStars(repo.stars)}
                                      </span>
                                  </button>
                              ))}
                          </div>
                      ))}
                  </div>
              )}
            </div>
          )}

          <footer className="mt-auto pt-8 text-center text-gray-500 text-sm max-w-4xl mx-auto space-y-2 pb-4">
            <p className="text-xs mt-4 text-gray-400">
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
        />
      )}

      <RepoSearchModal
          isOpen={isRepoSearchModalOpen}
          onClose={() => setIsRepoSearchModalOpen(false)}
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
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(settings) => {
          setAppSettings(settings);
          initializeLLMService(settings);
          geminiService.reinitialize();
        }}
      />

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
        `}
       </style>
    </div>
  );
};

export default App;
