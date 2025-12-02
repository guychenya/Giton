
import React from 'react';
import { Example } from '../types';
import Icon from './Icon';

interface ExampleCardProps extends Example {
  onClick: () => void;
  onVoiceChat: () => void;
  isDarkMode?: boolean;
}

const ExampleCard: React.FC<ExampleCardProps> = ({ name, description, icon, onClick, onVoiceChat, whenToUse, popularSites, isDarkMode = true }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onClick();
    }
  };
  
  const handleVoiceClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onVoiceChat();
  };
  
  return (
    <div
      key={name}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      className={`relative backdrop-blur-lg rounded-2xl border shadow-lg p-6 flex flex-col items-start h-full transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 group overflow-hidden ${
        isDarkMode 
          ? 'bg-white/10 border-white/20' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Voice Chat Action */}
      <button
        onClick={handleVoiceClick}
        className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 hover:bg-purple-600 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 z-10 backdrop-blur-md border ${
          isDarkMode
            ? 'bg-purple-500/20 text-purple-200 hover:text-white border-purple-500/30'
            : 'bg-purple-100 text-purple-700 hover:text-white border-purple-300'
        }`}
        title="Start live discussion about this topic"
      >
         <Icon icon="audio_spark" className="w-4 h-4" />
         <span className="text-xs font-bold uppercase tracking-wider">Live Chat</span>
      </button>

      <Icon icon={icon} className="w-14 h-14 mb-4" />
      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
      <p className={`text-sm flex-grow mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>

      <div className={`mt-auto pt-4 border-t w-full space-y-3 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        {/* When to Use */}
        <div className="flex items-start gap-2">
          <Icon icon="whenToUse" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-purple-300' : 'text-purple-500'}`} />
          <div>
            <h4 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>USED FOR</h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{whenToUse}</p>
          </div>
        </div>

        {/* Popular Sites */}
        <div className="flex items-start gap-2">
          <Icon icon="popularSites" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-purple-300' : 'text-purple-500'}`} />
          <div>
            <h4 className={`text-xs font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>USED BY</h4>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {popularSites.map(site => (
                <span key={site} className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  {site}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleCard;
