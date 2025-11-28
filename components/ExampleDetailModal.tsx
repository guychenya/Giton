

import React, { useEffect, useRef, useState } from 'react';
import { Example } from '../types';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';
import MarkdownRenderer from './MarkdownRenderer';

interface ExampleDetailModalProps {
  example: Example;
  content: string;
  isLoading?: boolean;
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
  onAskAssistant: (question: string) => void;
  onSave?: (title: string, content: string, type: 'guide') => void;
  repoUrl: string; // Added to enable cloning options
}

const ExampleDetailModal: React.FC<ExampleDetailModalProps> = ({ example, content, isLoading, onClose, contentRef, onAskAssistant, onSave, repoUrl }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  
  // Export State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Clone State
  const [isCloneMenuOpen, setIsCloneMenuOpen] = useState(false);
  const cloneMenuRef = useRef<HTMLDivElement>(null);
  const [copiedCloneUrl, setCopiedCloneUrl] = useState(false);

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
      const modalContainerRect = modalContainerRef.current?.getBoundingClientRect();
      if (!modalContainerRect) return;

      setSelection({
        text: selectedText,
        x: rect.left + rect.width / 2 - modalContainerRect.left,
        y: rect.top - modalContainerRect.top,
      });
    } else {
      setSelection(null);
    }
  };

  const handleAskAboutThis = () => {
    if (!selection) return;
    const question = `Regarding this text from the "${example.name}" documentation:\n\n> "${selection.text}"\n\nCan you explain this in more detail?`;
    onAskAssistant(question);
    setSelection(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelection(null);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (cloneMenuRef.current && !cloneMenuRef.current.contains(event.target as Node)) {
        setIsCloneMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selection, isExportMenuOpen, isCloneMenuOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && modalRef.current === event.target) {
      onClose();
    }
  };

  const handleSave = () => {
    if (onSave) {
        onSave(`Guide: ${example.name}`, content, 'guide');
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleExportMD = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${example.name.replace(/\s+/g, '-').toLowerCase()}-docs.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Basic formatted HTML for print view
      let formattedHtml = content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/`([^`]*)`/gim, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/gim, '<pre>$1</pre>')
        .replace(/\n/gim, '<br />');

      const printDoc = `
          <html>
          <head>
              <title>${example.name} Documentation</title>
              <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 0 auto; }
                  h1 { font-size: 2.5em; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
                  h2 { font-size: 1.8em; margin-top: 30px; border-bottom: 1px solid #e2e8f0; }
                  h3 { font-size: 1.4em; margin-top: 20px; }
                  p { margin-bottom: 1em; }
                  code { background: #f7fafc; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; border: 1px solid #edf2f7; }
                  pre { background: #f7fafc; padding: 15px; border-radius: 8px; overflow-x: auto; border: 1px solid #edf2f7; font-family: monospace; white-space: pre-wrap; }
                  ul { margin-bottom: 1em; }
                  li { margin-bottom: 0.5em; }
                  .header { margin-bottom: 40px; color: #718096; font-size: 0.9em; }
              </style>
          </head>
          <body>
              <div class="header">Generated by GitOn • ${new Date().toLocaleDateString()}</div>
              ${formattedHtml}
          </body>
          </html>
      `;

      printWindow.document.write(printDoc);
      printWindow.document.close();
      // Use timeout to ensure styles load before printing
      setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      }, 250);
      
      setIsExportMenuOpen(false);
  };

  const handleCopyCloneUrl = () => {
    if (repoUrl) {
      navigator.clipboard.writeText(`git clone ${repoUrl}`).then(() => {
        setCopiedCloneUrl(true);
        setTimeout(() => setCopiedCloneUrl(false), 2000);
      });
    }
    setIsCloneMenuOpen(false);
  };

  const handleOpenInGithubDesktop = () => {
    if (repoUrl) {
      // GitHub Desktop uses a custom URL scheme
      const desktopUrl = `github-mac://openRepo/${repoUrl}`; // Or x-github-client://openRepo/ for older versions
      window.open(desktopUrl, '_self');
    }
    setIsCloneMenuOpen(false);
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalContainerRef}
        className="relative bg-gray-800/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform animate-scale-in"
      >
        <div className="flex items-start sm:items-center justify-between p-4 sm:p-5 border-b border-white/10 flex-shrink-0 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 flex-shrink-0">
              <Icon icon={example.icon} className="w-8 h-8 text-gray-100" />
            </div>
            <div className="flex-grow">
              <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-white">{example.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <a
                  href={example.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-purple-400 transition-colors duration-200 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                  <span className="group-hover:underline">View Source</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
              {/* Save Button */}
              {onSave && !isLoading && (
                  <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-sm text-blue-300 transition-colors"
                      title="Save to Project Library"
                  >
                      {isSaved ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="save" className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
              )}

              {/* Clone Menu */}
              {repoUrl && (
                  <div className="relative" ref={cloneMenuRef}>
                      <button
                          onClick={() => setIsCloneMenuOpen(!isCloneMenuOpen)}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                          title="Clone repository"
                      >
                          <Icon icon="git" className="w-4 h-4" />
                          <span className="hidden sm:inline">Clone</span>
                      </button>
                      {isCloneMenuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in-sm overflow-hidden">
                              <button onClick={handleCopyCloneUrl} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                                  {copiedCloneUrl ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="copy" className="w-4 h-4" />}
                                  Copy Git URL
                              </button>
                              <button onClick={handleOpenInGithubDesktop} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 border-t border-white/5">
                                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                                      <title>GitHub Desktop</title>
                                      <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.334-1.756-1.334-1.756-1.09-.744.08-.729.08-.729 1.205.084 1.838 1.238 1.838 1.238 1.07 1.835 2.809 1.305 3.493.996.108-.775.419-1.305.762-1.605-2.665-.3-5.466-1.33-5.466-5.93 0-1.31.465-2.382 1.235-3.22-.12-.3-.535-1.524.117-3.176 0 0 1-.322 3.298 1.23.957-.266 1.983-.4 3.003-.404 1.02.004 2.046.138 3.003.404 2.296-1.552 3.297-1.23 3.297-1.23.653 1.652.238 2.877.118 3.176.77.838 1.233 1.91 1.233 3.22 0 4.61-2.806 5.62-5.485 5.92.43.37.81 1.096.81 2.22 0 1.605-.015 2.89-.015 3.285 0 .322.218.696.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.372-12-12-12z"/>
                                  </svg>
                                  Open in GitHub Desktop
                              </button>
                          </div>
                      )}
                  </div>
              )}

              {/* Export Menu */}
              <div className="relative" ref={exportMenuRef}>
                  <button
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                      disabled={isLoading}
                  >
                      <Icon icon="download" className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                  </button>
                  
                  {isExportMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in-sm overflow-hidden">
                          <button onClick={handleExportMD} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                              <span className="uppercase text-xs font-bold text-purple-400 w-8">MD</span>
                              Markdown File
                          </button>
                          <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 border-t border-white/5">
                              <span className="uppercase text-xs font-bold text-pink-400 w-8">PDF</span>
                              Print / Save PDF
                          </button>
                      </div>
                  )}
              </div>

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-gray-400 hover:text-white transition-colors rounded-full p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
        </div>

        <div 
          ref={contentRef} 
          className="p-4 sm:p-6 overflow-y-auto" 
          onMouseUp={handleSelectionChange}
        >
            <div className="prose-custom max-w-none">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-6">
                        {/* Animated Icon */}
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon icon={example.icon} className="w-12 h-12 text-purple-400" />
                            </div>
                        </div>
                        
                        {/* Progress Text */}
                        <div className="text-center space-y-2">
                            <p className="text-lg text-white font-medium">Generating Documentation</p>
                            <p className="text-sm text-gray-400 animate-pulse">Analyzing {example.name}...</p>
                        </div>
                        
                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                ) : (
                    <MarkdownRenderer content={content} />
                )}
            </div>
        </div>
        
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

      </div>
       <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
           @keyframes scale-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pop-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { transform: opacity: 1; transform: translate(-50%, -100%) scale(1); }
          }
          @keyframes fade-in-sm {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
          }
          .animate-scale-in {
             animation: scale-in 0.2s ease-out forwards;
          }
          .animate-pop-in {
             animation: pop-in 0.15s ease-out forwards;
          }
          .animate-fade-in-sm {
                animation: fade-in-sm 0.1s ease-out forwards;
                transform-origin: top right;
            }
        `}
       </style>
    </div>
  );
};

export default ExampleDetailModal;