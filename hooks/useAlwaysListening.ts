import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAlwaysListeningProps {
  enabled: boolean;
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  wakeWord?: string;
}

export const useAlwaysListening = ({
  enabled,
  onTranscript,
  onError,
  wakeWord = 'hey giton'
}: UseAlwaysListeningProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      
      // Check for wake word
      if (transcript.includes(wakeWord)) {
        setIsProcessing(true);
        
        // Extract command after wake word
        const commandIndex = transcript.indexOf(wakeWord) + wakeWord.length;
        const command = transcript.substring(commandIndex).trim();
        
        if (command) {
          onTranscript(command);
        }
        
        // Reset processing after 3 seconds
        setTimeout(() => setIsProcessing(false), 3000);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (enabled) startListening();
        }, 1000);
      } else {
        onError(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      
      // Auto-restart if still enabled
      if (enabled) {
        timeoutRef.current = setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      onError('Failed to start speech recognition');
    }
  }, [enabled, onTranscript, onError, wakeWord]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  return {
    isListening,
    isProcessing,
    startListening,
    stopListening
  };
};