
import React from 'react';
import { Example } from '../types';
import Icon from './Icon';

interface ExampleCardProps extends Example {
  onClick: () => void;
  onVoiceChat: () => void;
}

const ExampleCard: React.FC<ExampleCardProps> = ({ name, description, icon, onClick, onVoiceChat, whenToUse, popularSites }) => {
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
      className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg p-6 flex flex-col items-start h-full transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 group overflow-hidden"
    >
      {/* Voice Chat Action */}
      <button
        onClick={handleVoiceClick}
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-600 text-purple-200 hover:text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 z-10 backdrop-blur-md border border-purple-500/30"
        title="Start live discussion about this topic"
      >
         <Icon icon="audio_spark" className="w-4 h-4" />
         <span className="text-xs font-bold uppercase tracking-wider">Live Chat</span>
      </button>

      <Icon icon={icon} className="w-14 h-14 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
      <p className="text-gray-300 text-sm flex-grow mb-4">{description}</p>

      <div className="mt-auto pt-4 border-t border-white/10 w-full space-y-3">
        {/* When to Use */}
        <div className="flex items-start gap-2">
          <Icon icon="whenToUse" className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-gray-400 tracking-wider">USED FOR</h4>
            <p className="text-sm text-gray-200">{whenToUse}</p>
          </div>
        </div>

        {/* Popular Sites */}
        <div className="flex items-start gap-2">
          <Icon icon="popularSites" className="w-5 h-5 text-purple-300 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-gray-400 tracking-wider">USED BY</h4>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {popularSites.map(site => (
                <span key={site} className="bg-white/10 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
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
