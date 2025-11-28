
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, FunctionDeclaration, Type, GroundingMetadata } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import { geminiService } from '../services/geminiService';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;
const CHAT_HISTORY_KEY = 'gitexplore-assistant-history';

export type Message = {
  role: 'user' | 'model';
  text: string;
};

export interface AssistantActions {
  filterByCategory: (category: string) => string | void;
  searchExamples: (term: string) => string | void;
  showExampleDetails: (name: string) => string | void;
  closeDetails: () => string | void;
  closeAssistant: () => string | void;
  scrollToSectionInDetails: (sectionId: string) => string | void;
  resetFilters: () => string | void;
  performGoogleSearch: (query: string) => Promise<string> | string | void;
}

const createTextSystemInstruction = (context: string) => `You are a helpful and friendly assistant for "GitOn". 
Your goal is to help users understand the GitHub repository they are currently viewing.

Current Repository Context:
${context}

- Be concise and clear.
- Use Markdown (headings, lists, bold text, emojis, code blocks, tables) to format responses.
- When asked to compare items, use tables.
- If the user asks about specific code, try to infer from the file structure or general knowledge of the framework/language.
`;

const createVoiceSystemInstruction = (context: string) => `You are a voice assistant for "GitOn".
You are helping a user explore a GitHub repository.

Current Repository Context:
${context}

Tools & Behavior:
- **OPENING CARDS**: If the user asks to "see", "open", "show", or "check" a specific topic/card (e.g., "show me the auth system"), use 'showExampleDetails'.
- **CLOSING CARDS**: If the user asks to "close", "go back", "exit the card", or "dismiss", use 'closeDetails'.
- **FILTERING**: Use 'filterByCategory' if the user wants to see only "backend" or "frontend" items.
- **INTERNET SEARCH**: If the user asks for external info not in the repo (e.g. "What is the latest version of Next.js?", "Who created Python?"), use 'performGoogleSearch'.
- **EXITING**: Use 'closeAssistant' IMMEDIATELY when the user says "bye", "goodbye", "stop listening", or "leave the chat".
  **IMPORTANT:** Do NOT say goodbye back. Just call the 'closeAssistant' function.
- **NOT FOUND**: If a tool returns "not found" or "analysis in progress", apologize to the user and explain that you can't find that item yet.

- Keep spoken responses short and conversational.
`;

const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'filterByCategory',
        parameters: { type: Type.OBJECT, properties: { category: { type: Type.STRING, description: `The category to filter by.` } }, required: ['category'] },
        description: 'Filters the visible examples/cards by a given category. Returns a status message.',
    },
    {
        name: 'searchExamples',
        parameters: { type: Type.OBJECT, properties: { term: { type: Type.STRING, description: 'The search term to look for.' } }, required: ['term'] },
        description: 'Filters the visible examples/cards by a search term. Returns a status message.',
    },
    {
        name: 'showExampleDetails',
        parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: 'The fuzzy name of the example/card to show.' } }, required: ['name'] },
        description: 'Opens the detailed information modal for a specific example card. Returns "Success" or "Not Found".',
    },
    {
        name: 'closeDetails',
        description: 'Closes the currently open detail modal/card.',
    },
    {
        name: 'closeAssistant',
        description: 'Closes the voice assistant panel.',
    },
    {
        name: 'resetFilters',
        description: 'Resets all search and category filters.',
    },
    {
        name: 'scrollToSectionInDetails',
        parameters: { type: Type.OBJECT, properties: { sectionId: { type: Type.STRING, description: 'The ID of the section to scroll to.' } }, required: ['sectionId'] },
        description: 'Scrolls the details panel to a specific section.',
    },
    {
        name: 'performGoogleSearch',
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'The search query.' } }, required: ['query'] },
        description: 'Searches the internet for real-time information. Returns a summary.',
    }
];

export const useAssistant = (actions: AssistantActions, repoContext: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTextLoading, setTextLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [streamingModelResponse, setStreamingModelResponse] = useState<Message | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const updateMessages = useCallback((newMessages: Message[] | ((prevMessages: Message[]) => Message[])) => {
    setMessages(prevMessages => {
        const updated = typeof newMessages === 'function' ? newMessages(prevMessages) : newMessages;
        try {
            sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save chat history:", e);
        }
        return updated;
    });
  }, []);

  const clearChat = useCallback(() => {
    const initialMessage: Message[] = [{ role: 'model', text: 'Hello! I can help you explore this repository. Ask me anything about the structure, code, or functionality.' }];
    updateMessages(initialMessage); 
  }, [updateMessages]);

  const initialize = useCallback(() => {
    try {
        const storedHistory = sessionStorage.getItem(CHAT_HISTORY_KEY);
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.every((msg: any) => 
                (msg.role === 'user' || msg.role === 'model') && typeof msg.text === 'string'
            )) {
                setMessages(parsedHistory as Message[]);
            } else {
                clearChat();
            }
        } else {
            clearChat();
        }
    } catch (e) {
        console.error("Failed to parse or validate chat history from sessionStorage:", e);
        clearChat();
    }
  }, [clearChat]);

  useEffect(() => {
      // re-init if needed when repo changes, though chat persists
  }, [repoContext]);

  const sendTextMessage = async (message: string) => {
    setTextLoading(true);
    setError(null);

    const currentMessagesWithUser: Message[] = [...messages, { role: 'user', text: message }];
    updateMessages(currentMessagesWithUser);

    try {
      let modelResponse = '';
      setStreamingModelResponse({ role: 'model', text: '' });

      const stream = geminiService.chat(currentMessagesWithUser, createTextSystemInstruction(repoContext));
      
      for await (const chunk of stream) {
        modelResponse += chunk;
        setStreamingModelResponse({ role: 'model', text: modelResponse });
      }
      updateMessages(prev => [...prev, { role: 'model', text: modelResponse }]);

    } catch (e: any) {
      console.error('LLM text chat error:', e);
      setError(`There was an error communicating with the assistant: ${e.message || e}.`);
      updateMessages(prev => prev.slice(0, -1));
    } finally {
      setTextLoading(false);
      setStreamingModelResponse(null);
    }
  };

  const stopVoiceInteraction = useCallback(async () => {
    setVoiceStatus('idle');
    setLiveTranscript('');

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      audioSourcesRef.current.forEach(source => source.stop());
      audioSourcesRef.current.clear();
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {
        console.warn('Error closing live session:', e);
      }
      sessionPromiseRef.current = null;
    }
  }, []);

  const startVoiceInteraction = useCallback(async () => {
    if (voiceStatus === 'listening' || voiceStatus === 'connecting') return;
    
    // Try Gemini Live API first (best experience)
    const ai = geminiService.getGoogleGenAIInstance();
    if (ai && ai.live) {
        console.log('Using Gemini Live API for premium voice experience');
        // Continue with existing Gemini Live implementation
    } else if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Fallback to enhanced Web Speech API');
        startEnhancedVoiceRecognition();
        return;
    } else {
        setError('Voice features not supported. Please use a modern browser or add Gemini API key.');
        setVoiceStatus('error');
        return;
    }

    setVoiceStatus('connecting');
    setError(null);
    setLiveTranscript('');
    setStreamingModelResponse(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      nextStartTimeRef.current = 0;
      audioSourcesRef.current.clear();
      
      let finalUserTranscript = '';
      let currentModelResponse = '';
      let groundingMetadata: GroundingMetadata | undefined;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: createVoiceSystemInstruction(repoContext),
          tools: [{ functionDeclarations }], 
        },
        callbacks: {
          onopen: () => {
            setVoiceStatus('listening');
            mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(BUFFER_SIZE, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setLiveTranscript(message.serverContent.inputTranscription.text);
            }

            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentModelResponse += text;
                setStreamingModelResponse({ role: 'model', text: currentModelResponse });
            }
            
            if (message.serverContent?.groundingMetadata) {
                groundingMetadata = message.serverContent.groundingMetadata;
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                  console.log(`Calling tool: ${fc.name}`, fc.args);
                  const action = (actions as any)[fc.name];
                  let result = "ok";
                  
                  if (action) {
                      const actionResult = action(...Object.values(fc.args));
                      
                      if (actionResult instanceof Promise) {
                          try {
                            result = await actionResult;
                          } catch (e) {
                            console.error("Async tool execution failed", e);
                            result = "Error executing tool";
                          }
                      } else if (typeof actionResult === 'string') {
                          result = actionResult;
                      }
                  }
                  
                  sessionPromiseRef.current?.then(session => {
                      session.sendToolResponse({ 
                        functionResponses: [{
                          id: fc.id, 
                          name: fc.name, 
                          response: { result: result } 
                        }]
                      });
                  });
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, OUTPUT_SAMPLE_RATE, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
            
            if (message.serverContent?.turnComplete) {
                finalUserTranscript = liveTranscript.trim();
                let finalModelResponse = currentModelResponse.trim();
                
                if (groundingMetadata?.groundingChunks) {
                    const sources = groundingMetadata.groundingChunks
                        .map(chunk => chunk.web)
                        .filter(web => web?.uri && web?.title);
                    
                    if (sources.length > 0) {
                        const sourcesMarkdown = sources.map(source => `- [${source!.title}](${source!.uri})`).join('\n');
                        finalModelResponse += `\n\n**Sources:**\n${sourcesMarkdown}`;
                    }
                }

                if (finalUserTranscript || finalModelResponse) {
                    const newEntries: Message[] = [];
                    if (finalUserTranscript) newEntries.push({ role: 'user', text: finalUserTranscript });
                    if (finalModelResponse) newEntries.push({ role: 'model', text: finalModelResponse });
                    
                    if (newEntries.length > 0) {
                        updateMessages(prev => [...prev, ...newEntries]);
                    }
                }
                
                setLiveTranscript('');
                setStreamingModelResponse(null);
                currentModelResponse = '';
                groundingMetadata = undefined;
            }

            if (message.serverContent?.interrupted && outputAudioContextRef.current) {
              audioSourcesRef.current.forEach(source => source.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            stopVoiceInteraction();
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live API Error:', e);
            setError('An error occurred with the voice assistant. Please try again.');
            stopVoiceInteraction();
          },
        },
      });
    } catch (e: any) {
      console.error('Error starting voice interaction:', e);
      setError('Could not access microphone. Please check permissions.');
      setVoiceStatus('error');
    }
  }, [voiceStatus, actions, stopVoiceInteraction, updateMessages, liveTranscript, repoContext]);

  const startEnhancedVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      setVoiceStatus('error');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    setVoiceStatus('listening');
    setError(null);
    setLiveTranscript('🎤 Listening...');

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Only show final transcript, hide interim results for cleaner UX
      if (event.results[0].isFinal) {
        setLiveTranscript('');
        setVoiceStatus('idle');
        updateMessages(prev => [...prev, { role: 'user', text: transcript }]);
        
        // Check if we have any AI service available
        const ai = geminiService.getGoogleGenAIInstance();
        if (!ai) {
          const fallbackResponse = `I heard: "${transcript}". Please add your Gemini API key in Settings for AI responses.`;
          updateMessages(prev => [...prev, { role: 'model', text: fallbackResponse }]);
          await playResponseAudio(fallbackResponse);
          return;
        }
        
        // Get AI response
        try {
          let response = '';
          setStreamingModelResponse({ role: 'model', text: '' });
          
          const stream = geminiService.chat(
            [...messages, { role: 'user', text: transcript }], 
            `You are a voice assistant for GitOn. Keep responses concise and conversational. ${repoContext}`
          );
          
          for await (const chunk of stream) {
            response += chunk;
            setStreamingModelResponse({ role: 'model', text: response });
          }
          
          updateMessages(prev => [...prev, { role: 'model', text: response }]);
          
          // Enhanced text-to-speech with ElevenLabs fallback
          await playResponseAudio(response);
        } catch (e) {
          const errorResponse = 'Sorry, I had trouble processing that. Please try again.';
          updateMessages(prev => [...prev, { role: 'model', text: errorResponse }]);
          
          await playResponseAudio(errorResponse);
        } finally {
          setStreamingModelResponse(null);
          setLiveTranscript('');
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}. Please check microphone permissions.`);
      setVoiceStatus('error');
      setLiveTranscript('');
    };

    recognition.onend = () => {
      if (voiceStatus === 'listening') {
        setVoiceStatus('idle');
        setLiveTranscript('');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setError('Could not start speech recognition. Please check microphone permissions.');
      setVoiceStatus('error');
    }
  }, [messages, repoContext, updateMessages, voiceStatus]);

  const playResponseAudio = useCallback(async (text: string) => {
    try {
      // Try ElevenLabs first if available
      const settings = JSON.parse(localStorage.getItem('giton-settings') || '{}');
      
      if (settings.elevenLabsApiKey) {
        const { ElevenLabsService } = await import('../services/elevenLabsService');
        const elevenLabs = new ElevenLabsService(settings.elevenLabsApiKey);
        
        const audioBuffer = await elevenLabs.textToSpeech(text);
        await elevenLabs.playAudio(audioBuffer);
        return;
      }
    } catch (error) {
      console.warn('ElevenLabs TTS failed, falling back to browser TTS:', error);
    }
    
    // Fallback to browser TTS with better settings
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      
      // Try to use a better voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Enhanced')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    messages,
    isTextLoading,
    voiceStatus,
    error,
    liveTranscript,
    streamingModelResponse,
    initialize,
    sendTextMessage,
    startVoiceInteraction,
    stopVoiceInteraction,
    clearChat,
  };
};
