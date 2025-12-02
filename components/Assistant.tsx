
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Message } from '../hooks/useAssistant';
import Icon from './Icon';
import MarkdownRenderer from './MarkdownRenderer';

interface AssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  isTextLoading: boolean;
  voiceStatus: 'idle' | 'connecting' | 'listening' | 'error';
  error: string | null;
  liveTranscript: string;
  streamingModelResponse: Message | null;
  userInput: string;
  setUserInput: (input: string) => void;
  sendTextMessage: (message: string) => void;
  startVoiceInteraction: () => void;
  stopVoiceInteraction: () => void;
  clearChat: () => void;
  onSaveChat: (messages: Message[]) => void;
  isDarkMode?: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
}

const Assistant: React.FC<AssistantProps> = ({
  isOpen,
  onToggle,
  messages,
  isTextLoading,
  voiceStatus,
  error,
  liveTranscript,
  streamingModelResponse,
  userInput,
  setUserInput,
  sendTextMessage,
  startVoiceInteraction,
  stopVoiceInteraction,
  clearChat,
  onSaveChat,
  isDarkMode = true,
  isPinned,
  onTogglePin,
}) => {
  const [showLiveTranscript, setShowLiveTranscript] = useState(true);
  const mainContentRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isChatSaved, setIsChatSaved] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  // State and ref for resizing functionality
  const [width, setWidth] = useState(420);
  const isResizingRef = useRef(false);
  const assistantRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
    }
  }, [messages, isTextLoading, liveTranscript, streamingModelResponse]);
  
  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Resizing Logic ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const minWidth = 320;
    const maxWidth = 800;
    let newWidth = e.clientX;
    
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    
    setWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  // Auto-close when clicking outside if not pinned
  useEffect(() => {
    if (!isOpen || isPinned) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (assistantRef.current && !assistantRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isPinned, onToggle]);
  
  const handleSelectionChange = (event: React.MouseEvent) => {
    if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
      return;
    }

    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.rangeCount === 0) {
      setSelection(null);
      return;
    }
    const selectedText = selectionObj.toString().trim();

    if (selectedText.length > 0) {
      const range = selectionObj.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const mainRect = mainContentRef.current?.getBoundingClientRect();
      if (!mainRect) return;

      setSelection({
        text: selectedText,
        x: rect.left + rect.width / 2 - mainRect.left,
        y: rect.top - mainRect.top + (mainContentRef.current?.scrollTop || 0),
      });
    } else {
      setSelection(null);
    }
  };

  const handleAskAboutThis = () => {
    if (!selection) return;
    const question = `Regarding this part of our conversation:\n\n> "${selection.text}"\n\nCan you elaborate?`;
    setUserInput(question);
    setSelection(null);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelection(null);
      }
    };
    if (selection) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selection]);
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    });
  };

  const formatHistory = (format: 'md' | 'txt'): string => {
    return messages.map(msg => {
      const prefix = format === 'md' ? `**${msg.role === 'user' ? 'You' : 'Assistant'}:**\n` : `[${msg.role === 'user' ? 'You' : 'Assistant'}]:\n`;
      return `${prefix}${msg.text}\n`;
    }).join(format === 'md' ? '\n---\n\n' : '\n\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleExportMD = () => {
    const content = formatHistory('md');
    downloadFile(content, 'chat-history.md', 'text/markdown');
    setMenuOpen(false);
  };

  const handleExportTXT = () => {
    const content = formatHistory('txt');
    downloadFile(content, 'chat-history.txt', 'text/plain');
    setMenuOpen(false);
  };

  const handleExportPDF = () => {
    setMenuOpen(false);
    const printableContent = `
      <html>
        <head>
          <title>Chat History</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #111; padding: 1em; }
            .message { margin-bottom: 1.5em; page-break-inside: avoid; }
            .role { font-weight: bold; text-transform: capitalize; margin-bottom: 0.5em; }
            .text { white-space: pre-wrap; word-wrap: break-word; font-family: monospace; background-color: #f4f4f4; padding: 1em; border-radius: 5px; }
            hr { border: 0; border-top: 1px solid #ccc; margin: 1.5em 0; }
          </style>
        </head>
        <body>
          <h1>Chat History</h1>
          ${messages.map(msg => `
            <div class="message">
              <div class="role">${msg.role}</div>
              <div class="text"><pre>${msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>
            </div>
          `).join('<hr/>')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };
  
  const handleClearChat = () => {
    clearChat();
    setMenuOpen(false);
  };

  const handleSaveChat = () => {
      onSaveChat(messages);
      setIsChatSaved(true);
      setTimeout(() => setIsChatSaved(false), 2000);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() || uploadedImage) {
      let message = userInput;
      if (uploadedImage) {
        message = `[IMAGE:${uploadedImage}]\n${userInput || 'Please analyze this image and extract any repository information or text you can find.'}`;
      }
      sendTextMessage(message);
      setUserInput('');
      setUploadedImage(null);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImage(base64);
        setUserInput('Analyze this image and extract any GitHub repository information, URLs, or text you can find.');
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|js|ts|tsx|jsx|py|java|cpp|c|h|css|html|xml|yaml|yml)$/)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUserInput(`I've uploaded a file: ${file.name}\n\nPlease analyze this file content and extract any relevant information.\n\n${content.substring(0, 5000)}`);
      };
      reader.readAsText(file);
    } else {
      alert(`File type not supported: ${file.type || file.name}\n\nSupported: Images, text files, code files`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleToggleVoice = () => {
    if (voiceStatus === 'listening') {
      stopVoiceInteraction();
    } else if (voiceStatus === 'idle' || voiceStatus === 'error') {
      startVoiceInteraction();
    }
  };

  return (
    <>
      <aside
        ref={assistantRef}
        className={`relative z-20 flex flex-col h-full backdrop-blur-2xl border-r transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-900/40 border-white/10' : 'bg-white border-gray-300'}`}
        style={{ width: isOpen ? `${width}px` : '0px' }}
        aria-hidden={!isOpen}
      >
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <header className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 flex-1">
              <Icon icon="audio_spark" className="w-6 h-6 text-purple-400" />
              <h2 id="assistant-title" className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Assistant
              </h2>
              
              {/* Model Selector */}
              <select
                className={`ml-auto mr-2 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                title="Select AI Model"
              >
                <option value="gemini">Gemini 2.5</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude">Claude 3.5</option>
                <option value="gpt-4-mini">GPT-4 Mini</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                  onClick={handleClearChat}
                  title="New Chat"
                  className={`transition-colors rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${isDarkMode ? 'text-gray-400 hover:text-white focus:ring-offset-gray-900' : 'text-gray-600 hover:text-gray-900 focus:ring-offset-white'}`}
              >
                  <Icon icon="plus" className="w-5 h-5" />
              </button>
              
              <div className="relative" ref={menuRef}>
                  <button
                      onClick={() => setMenuOpen(!isMenuOpen)}
                      aria-label="Share & Export"
                      title="Share & Export"
                      className={`transition-colors rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${isDarkMode ? 'text-gray-400 hover:text-white focus:ring-offset-gray-900' : 'text-gray-600 hover:text-gray-900 focus:ring-offset-white'}`}
                  >
                      <Icon icon="share" className="w-5 h-5" />
                  </button>
                  {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 animate-fade-in-sm">
                          <button onClick={() => { handleSaveChat(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                            {isChatSaved ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="save" className="w-4 h-4" />}
                            Save to Library
                          </button>
                          <div className="border-t border-white/10 my-1"></div>
                          <button onClick={handleExportMD} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Icon icon="document" className="w-4 h-4" />
                            Export as MD
                          </button>
                          <button onClick={handleExportTXT} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Icon icon="document" className="w-4 h-4" />
                            Export as TXT
                          </button>
                          <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Icon icon="document" className="w-4 h-4" />
                            Export as PDF
                          </button>
                      </div>
                  )}
              </div>

              <button
                onClick={onTogglePin}
                aria-label={isPinned ? "Unpin assistant" : "Pin assistant"}
                title={isPinned ? "Pinned (stays open)" : "Unpinned (auto-close)"}
                className={`transition-colors rounded-full p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 ${isPinned ? 'text-purple-400' : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}`}
              >
                <svg className="w-6 h-6" fill={isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8" />
                </svg>
              </button>
            </div>
          </header>

          <main ref={mainContentRef} onMouseUp={handleSelectionChange} className="custom-scrollbar flex-1 p-4 overflow-y-auto space-y-4 relative">
            {messages.map((message, index) => {
              const imageMatch = message.text.match(/\[IMAGE:(.+?)\]/);
              const imageUrl = imageMatch ? imageMatch[1] : null;
              const textWithoutImage = imageUrl ? message.text.replace(/\[IMAGE:.+?\]\n?/, '') : message.text;
              
              return (
              <div key={index} className={`flex items-start gap-3 group relative ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'model' && <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center"><Icon icon="bot" className="w-5 h-5 text-purple-300"/></div>}
                
                <div className={`max-w-full text-base ${message.role === 'user' ? 'bg-purple-600 rounded-2xl rounded-br-none px-5 py-3' : 'bg-transparent'}`}>
                  {imageUrl && (
                    <div className="mb-2">
                      <img 
                        src={imageUrl} 
                        alt="Uploaded" 
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                        onClick={() => setEnlargedImage(imageUrl)}
                      />
                    </div>
                  )}
                  { message.role === 'user' 
                      ? <div className="text-white"><MarkdownRenderer content={textWithoutImage} isDarkMode={isDarkMode} /></div>
                      : <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}><MarkdownRenderer content={textWithoutImage} isDarkMode={isDarkMode} /></div>
                  }
                </div>
                
                 <button 
                    onClick={() => handleCopy(message.text, index)}
                    aria-label="Copy message"
                    className={`absolute -top-3 p-1 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100
                                ${message.role === 'user' ? 'left-2' : 'right-10'}`}
                >
                    {copiedMessageIndex === index ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="copy" className="w-4 h-4" />}
                </button>

                 {message.role === 'user' && <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center"><Icon icon="user" className="w-5 h-5 text-blue-300"/></div>}
              </div>
            )})}
            {streamingModelResponse && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center"><Icon icon="bot" className="w-5 h-5 text-purple-300"/></div>
                <div className={`max-w-full text-base bg-transparent ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <MarkdownRenderer content={streamingModelResponse.text} isDarkMode={isDarkMode} />
                </div>
              </div>
            )}
            {isTextLoading && (
              <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center"><Icon icon="bot" className="w-5 h-5 text-purple-300"/></div>
                 <div className="max-w-xs md:max-w-sm px-4 py-3 rounded-2xl bg-black/20 text-gray-200 rounded-bl-none flex items-center">
                    <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse animation-delay-2000 mx-1"></div>
                    <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse animation-delay-4000"></div>
                 </div>
              </div>
            )}
            {error && <p className="text-red-400 text-sm px-4">{error}</p>}
             {selection && (
              <div
                ref={popoverRef}
                style={{ 
                  top: `${selection.y}px`, 
                  left: `${selection.x}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-full mt-[-10px] z-50 bg-gray-700/80 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-1.5 flex items-center gap-2 transform animate-pop-in"
              >
                <button 
                  onClick={handleAskAboutThis} 
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <Icon icon="bot" className="w-4 h-4 text-purple-300" />
                  <span>Ask about this...</span>
                </button>
              </div>
            )}
          </main>
          
          <footer 
            className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedImage && (
              <div className="mb-3 relative inline-block">
                <img src={uploadedImage} alt="Upload preview" className="h-20 rounded-lg border border-white/20" />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <Icon icon="close" className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="relative">
              <div className={`relative w-full border rounded-lg overflow-hidden transition-all duration-300 ${
                isDragging ? 'border-purple-500 bg-purple-900/20 ring-2 ring-purple-500' :
                voiceStatus === 'listening' ? 'bg-purple-900/20 ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] border-white/20' : 
                'bg-white/5 border-white/20'
              }`}>
                <textarea
                  value={voiceStatus === 'listening' && !showLiveTranscript ? liveTranscript : userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={voiceStatus === 'listening' ? 'Listening...' : 'Ask a question...'}
                  aria-label="Chat message input"
                  rows={1}
                  disabled={voiceStatus !== 'idle'}
                  className={`custom-scrollbar w-full bg-transparent py-3 px-4 pr-32 focus:outline-none resize-none max-h-32 ${isDarkMode ? 'text-white placeholder-gray-400 disabled:bg-gray-800/50' : 'text-gray-900 placeholder-gray-500 disabled:bg-gray-100'}`}
                />
                
                {voiceStatus === 'listening' && showLiveTranscript && (
                  <div className="absolute inset-0 pl-12 pr-20 py-3 text-purple-300 font-mono pointer-events-none overflow-hidden flex items-center">
                    <p className="whitespace-nowrap overflow-hidden animate-glow" style={{ textShadow: '0 0 5px rgba(192, 132, 252, 0.7)' }}>
                      {liveTranscript}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                )}
                

                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-purple-900/50 backdrop-blur-sm rounded-lg pointer-events-none">
                      <p className="text-white font-medium">Drop image to analyze</p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                    className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    title="Attach file or image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    aria-label={voiceStatus === 'listening' ? 'Stop listening' : 'Start voice input'}
                    disabled={isTextLoading || voiceStatus === 'connecting'}
                    className={`p-1.5 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait ${voiceStatus === 'listening' ? 'text-red-500 animate-pulse' : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                  >
                    <Icon icon={voiceStatus === 'listening' ? 'stop' : 'microphone'} className="w-5 h-5" />
                  </button>
                  
                  {voiceStatus === 'listening' && (
                    <button
                      type="button"
                      onClick={() => setShowLiveTranscript(!showLiveTranscript)}
                      aria-label={showLiveTranscript ? "Hide transcript" : "Show transcript"}
                      className={`p-1.5 rounded-full transition-all ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    >
                      <Icon icon={showLiveTranscript ? 'eye-slash' : 'eye'} className="w-5 h-5" />
                    </button>
                  )}
                  
                  {(userInput.trim() || uploadedImage) && voiceStatus === 'idle' && (
                    <button
                      type="submit"
                      aria-label="Send message"
                      className="p-2 rounded-full text-white bg-purple-600 hover:bg-purple-500 transition-all"
                    >
                      <Icon icon="send" className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </footer>
        </div>

        {isOpen && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none hover:bg-white/10 transition-colors duration-200"
            aria-label="Resize assistant panel"
            role="separator"
          />
        )}
      </aside>

       
       {/* Image Enlargement Modal */}
       {enlargedImage && (
         <div 
           className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
           onClick={() => setEnlargedImage(null)}
         >
           <button
             onClick={() => setEnlargedImage(null)}
             className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
           >
             <Icon icon="close" className="w-6 h-6" />
           </button>
           <img 
             src={enlargedImage} 
             alt="Enlarged view" 
             className="max-w-full max-h-full object-contain rounded-lg"
             onClick={(e) => e.stopPropagation()}
           />
         </div>
       )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.3); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.15) transparent; }
       `}</style>
    </>
  );
};

export default Assistant;
