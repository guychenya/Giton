import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(50).fill(0));

  useEffect(() => {
    if (isActive) {
      startAudioCapture();
    } else {
      stopAudioCapture();
    }

    return () => {
      stopAudioCapture();
    };
  }, [isActive]);

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      drawWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioCapture = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Convert frequency data to visual levels
    const newLevels = [];
    const step = Math.floor(dataArrayRef.current.length / 50);
    
    for (let i = 0; i < 50; i++) {
      const start = i * step;
      const end = start + step;
      let sum = 0;
      
      for (let j = start; j < end && j < dataArrayRef.current.length; j++) {
        sum += dataArrayRef.current[j];
      }
      
      const average = sum / step;
      const normalized = Math.min(average / 255, 1);
      newLevels.push(normalized);
    }

    setAudioLevels(newLevels);
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  return (
    <div className="flex items-center justify-center h-16 gap-1">
      {audioLevels.map((level, index) => {
        const height = Math.max(4, level * 60); // Min height 4px, max 60px
        const opacity = Math.max(0.3, level);
        
        return (
          <div
            key={index}
            className="bg-purple-400 rounded-full transition-all duration-75"
            style={{
              width: '3px',
              height: `${height}px`,
              opacity: opacity,
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;