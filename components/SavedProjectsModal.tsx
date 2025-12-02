
import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { db, SavedProject, SavedReport } from '../utils/db';
import LoadingSpinner from './LoadingSpinner';

interface SavedProjectsModalProps {
  isDarkMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: (report: SavedReport) => void;
  onLoadProject: (repoUrl: string) => void;
}

type ProjectWithCount = SavedProject & { reportCount: number };

const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({ isOpen, onClose, onOpenReport, onLoadProject, isDarkMode = true }) => {
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      setSelectedProject(null);
      setReports([]);
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await db.getProjects();
      const projectsWithCounts = await Promise.all(
          data.map(async (p) => ({
              ...p,
              reportCount: await db.getReportCount(p.id)
          }))
      );
      setProjects(projectsWithCounts.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (project: SavedProject) => {
    setSelectedProject(project);
    setIsLoading(true);
    try {
      const projectReports = await db.getProjectReports(project.id);
      setReports(projectReports.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedProject(null);
    setReports([]);
  };
  
  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this report?')) {
          await db.deleteReport(id);
          if (selectedProject) {
              await handleSelectProject(selectedProject); // Refresh reports
              await loadProjects(); // Refresh project counts
          }
      }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('Are you sure you want to delete this project and all its saved reports?')) {
          await db.deleteProject(id);
          await loadProjects();
          if (selectedProject?.id === id) handleBack();
      }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`border rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative ${isDarkMode ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-300'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b z-10 ${isDarkMode ? "border-white/10 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Icon icon="library" className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Saved Library</h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Your local serverless database of reports</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"}`}>
            <Icon icon="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
            {isLoading && !selectedProject ? (
                <div className="w-full h-full flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : !selectedProject ? (
                // Project List
                <div className="w-full p-6 overflow-y-auto custom-scrollbar">
                    {projects.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">
                            <Icon icon="folder" className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">No saved projects yet.</p>
                            <p className="text-sm">Analyze a repo and click "Save" on any report to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map(proj => (
                                <div 
                                    key={proj.id} 
                                    onClick={() => handleSelectProject(proj)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer transition-all group relative flex flex-col justify-between"
                                >
                                    <div>
                                        <h3 className={`text-lg font-bold group-hover:text-purple-500 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`} truncate truncate mb-1">
                                            {proj.repo}
                                        </h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{proj.owner}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{proj.language}</span>
                                            <span>{proj.reportCount} item(s)</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onLoadProject(proj.id); onClose(); }}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md flex-1 text-center"
                                        >
                                            Analyze Live
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteProject(e, proj.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded-md"
                                            title="Delete Project"
                                        >
                                            <Icon icon="trash" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Report List for Selected Project
                <div className="w-full flex flex-col h-full">
                    <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
                        <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium">
                            <Icon icon="chevron-left" className="w-4 h-4" /> Back to Projects
                        </button>
                        <span className="text-gray-600">|</span>
                        <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedProject.owner}/{selectedProject.repo}</h3>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {isLoading ? <LoadingSpinner /> : reports.length === 0 ? (
                             <div className="text-center text-gray-500 mt-20">
                                <p>No saved reports for this project.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {reports.map(report => {
                                    const iconMap = {
                                        diagram: 'backend',
                                        prd: 'document',
                                        guide: 'file',
                                        chat: 'chat',
                                    };
                                    const colorMap = {
                                        diagram: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
                                        prd: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
                                        guide: 'bg-gray-700/50 border-gray-600 text-gray-300',
                                        chat: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
                                    }
                                    return (
                                    <div 
                                        key={report.id}
                                        onClick={() => { onOpenReport(report); onClose(); }}
                                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorMap[report.type]}`}>
                                                <Icon icon={iconMap[report.type]} className={`w-5 h-5`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-medium group-hover:text-purple-500 ${isDarkMode ? "text-white" : "text-gray-900"}`} transition-colors transition-colors">{report.title}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {report.type.toUpperCase()} • Created {formatDate(report.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteReport(e, report.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Icon icon="trash" className="w-4 h-4" />
                                        </button>
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
      <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.2); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.3); }
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SavedProjectsModal;