import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import AudioWaveform from './AudioWaveform';

interface VoiceAssistantProps {
  isListening: boolean;
  onToggle: () => void;
  transcript: string;
  isProcessing: boolean;
  error?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isListening,
  onToggle,
  transcript,
  isProcessing,
  error
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveAnimation, setWaveAnimation] = useState(false);

  useEffect(() => {
    if (isListening || isProcessing) {
      setWaveAnimation(true);
      setIsExpanded(true);
    } else {
      setWaveAnimation(false);
      setTimeout(() => setIsExpanded(false), 2000);
    }
  }, [isListening, isProcessing]);

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Pulse Animation */}
          {isListening && (
            <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping"></div>
          )}
          
          {/* Main Button */}
          <button
            onClick={onToggle}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 scale-110' 
                : 'bg-purple-600 hover:bg-purple-700'
            } ${error ? 'bg-red-600' : ''}`}
            title={isListening ? 'Stop listening' : 'Start voice assistant'}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon 
                icon={isListening ? "stop" : "microphone"} 
                className="w-7 h-7 text-white" 
              />
            )}
          </button>

          {/* Wave Visualization */}
          {waveAnimation && (
            <>
              <div className="absolute -top-2 -left-2 w-20 h-20 rounded-full border-2 border-purple-400/30 animate-ping"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full border border-purple-300/20 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full border border-purple-200/10 animate-pulse" style={{animationDelay: '1s'}}></div>
            </>
          )}
        </div>

        {/* Transcript Bubble - Only show when not actively listening */}
        {isExpanded && (transcript || error) && !isListening && (
          <div className="absolute bottom-20 right-0 w-80 max-w-sm">
            <div className="bg-gray-900/95 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl animate-fade-in">
              {error ? (
                <div className="text-red-300 text-sm flex items-center gap-2">
                  <Icon icon="warning" className="w-4 h-4" />
                  {error}
                </div>
              ) : (
                <div className="text-white text-sm">
                  {transcript && (
                    <div className="text-gray-200">
                      {transcript}
                    </div>
                  )}
                  {isProcessing && (
                    <div className="text-blue-300 text-xs mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Processing...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Real Audio Wave Visualization */}
        {isListening && (
          <div className="absolute bottom-20 right-0 w-80 max-w-sm">
            <div className="bg-gray-900/95 backdrop-blur border border-purple-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-sm font-medium">Recording</span>
                <button 
                  onClick={onToggle}
                  className="ml-auto text-red-400 hover:text-red-300 text-xs underline"
                >
                  Stop
                </button>
              </div>
              <AudioWaveform isActive={isListening} />
            </div>
          </div>
        )}
      </div>

      {/* Always-on Indicator */}
      {isListening && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-red-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Voice Active
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;

// Add CSS for fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);