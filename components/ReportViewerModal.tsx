
import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import MarkdownRenderer from './MarkdownRenderer';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  reportType: 'guide' | 'chat';
  onSave?: (title: string, content: string, type: 'guide' | 'chat') => void;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, title, content, reportType, onSave }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setIsExportMenuOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current === event.target) onClose();
  };

  const handleSave = () => {
      if (onSave) {
          onSave(title, content, reportType);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
      }
  };

  const downloadFile = (data: string, filename: string, mimeType: string) => {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExportMenuOpen(false);
  };
  
  const handleExportMD = () => downloadFile(content, `${title.replace(/\s+/g, '-')}.md`, 'text/markdown');
  const handleExportTXT = () => downloadFile(content, `${title.replace(/\s+/g, '-')}.txt`, 'text/plain');

  const handleExportPDF = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

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
              <title>${title}</title>
              <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 0 auto; }
                  h1,h2,h3 { color: #000; }
                  pre, code { background: #f0f0f0; padding: 2px 5px; border-radius: 4px; }
                  pre { padding: 1em; white-space: pre-wrap; }
              </style>
          </head>
          <body><h1>${title}</h1>${formattedHtml}</body>
          </html>
      `;

      printWindow.document.write(printDoc);
      printWindow.document.close();
      setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
      }, 250);
      
      setIsExportMenuOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[75] p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden relative animate-scale-in">
        
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-800/50 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                reportType === 'chat' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-gray-700/50 border-gray-600'
            }`}>
                <Icon icon={reportType} className={`w-6 h-6 ${
                    reportType === 'chat' ? 'text-blue-300' : 'text-gray-300'
                }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white truncate max-w-md">{title}</h2>
              <p className="text-sm text-gray-400 capitalize">{reportType} loaded from library</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
              {onSave && (
                  <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-sm text-blue-300 transition-colors"
                      title="Save a new copy"
                  >
                      {isSaved ? <Icon icon="check" className="w-4 h-4 text-green-400" /> : <Icon icon="save" className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save Copy'}</span>
                  </button>
              )}

              <div className="relative" ref={exportMenuRef}>
                  <button
                      onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                  >
                      <Icon icon="download" className="w-4 h-4" />
                      <span>Export</span>
                  </button>
                  
                  {isExportMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-50 animate-fade-in-sm overflow-hidden">
                          <button onClick={handleExportMD} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2">
                             <span className="uppercase text-xs font-bold text-purple-400 w-8">MD</span> Markdown
                          </button>
                           <button onClick={handleExportTXT} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 border-t border-white/5">
                             <span className="uppercase text-xs font-bold text-blue-400 w-8">TXT</span> Text File
                          </button>
                          <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 border-t border-white/5">
                             <span className="uppercase text-xs font-bold text-pink-400 w-8">PDF</span> Print / PDF
                          </button>
                      </div>
                  )}
              </div>

              <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <Icon icon="close" className="w-6 h-6" />
              </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            <div className="prose-custom max-w-none">
                <MarkdownRenderer content={content} />
            </div>
        </div>
      </div>
      <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.3); }
            @keyframes fade-in-sm { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-fade-in-sm { animation: fade-in-sm 0.1s ease-out forwards; transform-origin: top right; }
            @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ReportViewerModal;
