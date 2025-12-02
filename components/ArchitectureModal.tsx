


import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramCode: string;
  isLoading: boolean;
  onSave?: (title: string, content: string, type: 'diagram') => void;
  isDarkMode?: boolean;
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose, diagramCode, isLoading, onSave, isDarkMode = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Export State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'sans-serif',
      flowchart: { htmlLabels: false },
    });
  }, [isDarkMode]);

  useEffect(() => {
    if (isOpen) {
        // Reset zoom/pan on open
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsExportMenuOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    if (isExportMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramCode || isLoading) return;
      
      try {
        setRenderError(null);
        
        // Create a temporary div to decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = diagramCode;
        let cleanCode = textarea.value;
        
        // Additional cleanup
        cleanCode = cleanCode
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ');
        
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, cleanCode);
        setSvgContent(svg);
      } catch (error) {
        console.error("Mermaid render error:", error);
        setRenderError("Failed to render architecture diagram. The syntax generated might be invalid.");
      }
    };

    if (isOpen) {
      renderDiagram();
    }
  }, [diagramCode, isOpen, isLoading]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };
  
  // Zoom Controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Zoom factor
    const delta = -Math.sign(e.deltaY) * 0.1;
    setScale(prev => {
        const newScale = Math.min(Math.max(prev + delta, 0.5), 5);
        return Number(newScale.toFixed(2));
    });
  };

  // Pan Controls
  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
  };
  
  const handleMouseUp = () => setIsDragging(false);

  // Export Functions
  const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
      if (!svgContent) return;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      downloadBlob(blob, 'system-architecture.svg');
      setIsExportMenuOpen(false);
  };

  const handleExportCode = () => {
      if (!diagramCode) return;
      const blob = new Blob([diagramCode], { type: 'text/plain' });
      downloadBlob(blob, 'system-architecture.mmd');
      setIsExportMenuOpen(false);
  };

  const handleExportPNG = () => {
      if (!containerRef.current) return;
      const svgElement = containerRef.current.querySelector('svg');
      if (!svgElement) return;

      // Get the intrinsic dimensions from the viewBox
      // This ensures we export the FULL diagram, not just the visible part
      const viewBox = svgElement.viewBox.baseVal;
      // Fallbacks in case viewBox is missing (rare for Mermaid)
      const originalWidth = viewBox.width || svgElement.getBoundingClientRect().width;
      const originalHeight = viewBox.height || svgElement.getBoundingClientRect().height;

      const scaleFactor = 3; // 3x scale for high resolution
      const canvas = document.createElement('canvas');
      canvas.width = originalWidth * scaleFactor;
      canvas.height = originalHeight * scaleFactor;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      const img = new Image();

      // Serialize the SVG content
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      // Clean up potentially missing width/height for the Image constructor
      // We forcibly inject the intrinsic dimensions so the browser knows how to render the Blob
      if (!svgString.includes('width=')) {
          svgString = svgString.replace('<svg', `<svg width="${originalWidth}" height="${originalHeight}"`);
      }

      const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
          ctx.fillStyle = '#0d1117'; // Dark background matching theme
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw full size
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
              if (blob) downloadBlob(blob, 'system-architecture.png');
              URL.revokeObjectURL(url);
          });
      };
      
      img.onerror = (e) => {
          console.error("Error loading SVG for export", e);
          URL.revokeObjectURL(url);
      };

      img.src = url;
      setIsExportMenuOpen(false);
  };

  const handleSave = () => {
      if (onSave) {
          onSave('System Architecture', diagramCode, 'diagram');
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
      }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className={`border rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative ${
        isDarkMode ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-300'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b z-10 ${
          isDarkMode ? 'border-white/10 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                <Icon icon="backend" className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Design Specification</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interactive Architecture Canvas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              {/* Save Button */}
              {onSave && !isLoading && !renderError && (
                  <button
                      onClick={handleSave}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                        isDarkMode
                          ? 'bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30 text-blue-300'
                          : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700'
                      }`}
                      title="Save to Project Library"
                  >
                      {isSaved ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="save" className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
              )}

              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                  <button
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700'
                      }`}
                  >
                      <Icon icon="download" className="w-4 h-4" />
                      <span>Export</span>
                  </button>
                  
                  {isExportMenuOpen && (
                      <div className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-xl z-50 animate-fade-in-sm overflow-hidden ${
                        isDarkMode ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-300'
                      }`}>
                          <button onClick={handleExportPNG} className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${
                            isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}>
                              <span className="uppercase text-xs font-bold text-purple-400 w-8">PNG</span>
                              Image File
                          </button>
                          <button onClick={handleExportSVG} className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 border-t ${
                            isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white border-white/5' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                          }`}>
                              <span className="uppercase text-xs font-bold text-pink-400 w-8">SVG</span>
                              Vector File
                          </button>
                          <button onClick={handleExportCode} className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 border-t ${
                            isDarkMode ? 'text-gray-300 hover:bg-white/10 hover:text-white border-white/5' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200'
                          }`}>
                              <span className="uppercase text-xs font-bold text-blue-400 w-8">CODE</span>
                              Mermaid Source
                          </button>
                      </div>
                  )}
              </div>

              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon icon="close" className="w-6 h-6" />
              </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
            className={`flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing ${
              isDarkMode ? 'bg-[#0d1117]' : 'bg-gray-50'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
          {isLoading ? (
             <div className="flex flex-col items-center justify-center space-y-4 h-full">
                <LoadingSpinner />
                <p className="text-gray-400 animate-pulse">Generating high-fidelity architecture diagram...</p>
             </div>
          ) : renderError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 max-w-lg mx-auto text-center">
               <Icon icon="terminal" className="w-12 h-12 text-red-400 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-red-300 mb-2">Visualization Failed</h3>
               <p className="text-gray-400 mb-4">{renderError}</p>
               <pre className="text-left bg-black/50 p-4 rounded text-xs text-gray-500 overflow-auto max-h-32 w-full">
                   {diagramCode}
               </pre>
            </div>
          ) : (
            <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
            >
                <div 
                    ref={containerRef}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    className="pointer-events-none select-none" 
                />
            </div>
          )}
          
          {/* Zoom Controls */}
          {!isLoading && !renderError && (
              <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-gray-800/90 backdrop-blur border border-white/10 p-2 rounded-lg shadow-xl z-20">
                  <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors" title="Zoom In">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button onClick={handleResetZoom} className="p-2 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors text-xs font-bold" title="Reset View">
                      1:1
                  </button>
                  <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-md text-gray-300 hover:text-white transition-colors" title="Zoom Out">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
              </div>
          )}
          
          {/* Legend */}
           {!isLoading && !renderError && (
              <div className="absolute bottom-6 left-6 bg-gray-800/90 backdrop-blur border border-white/10 p-4 rounded-lg shadow-xl max-w-xs z-20 pointer-events-none select-none">
                  <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">Components</h4>
                  <div className="space-y-2 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-[#1f2937] border border-[#a855f7]"></span>
                          <span>Core Service / App</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#1e3a8a] border border-[#60a5fa]"></span>
                          <span>Database / Store</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-[#064e3b] border border-[#34d399]"></span>
                          <span>Client / Frontend</span>
                      </div>
                  </div>
              </div>
          )}
        </div>
        
        <style>{`
            @keyframes fade-in-sm {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in-sm {
                animation: fade-in-sm 0.1s ease-out forwards;
                transform-origin: top right;
            }
        `}</style>
      </div>
    </div>
  );
};

export default ArchitectureModal;