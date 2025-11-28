import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

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
            <div className="absolute -top-2 -left-2 w-20 h-20 rounded-full border-2 border-purple-400/50 animate-pulse"></div>
          )}
        </div>

        {/* Transcript Bubble */}
        {isExpanded && (transcript || error) && (
          <div className="absolute bottom-20 right-0 w-80 max-w-sm">
            <div className="bg-gray-900/95 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-xl">
              {error ? (
                <div className="text-red-300 text-sm flex items-center gap-2">
                  <Icon icon="warning" className="w-4 h-4" />
                  {error}
                </div>
              ) : (
                <div className="text-white text-sm">
                  {isListening && (
                    <div className="text-purple-300 text-xs mb-1 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      Listening...
                    </div>
                  )}
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