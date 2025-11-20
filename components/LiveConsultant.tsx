import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Radio, Volume2 } from 'lucide-react';
import { getLiveClient } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { LiveServerMessage, Modality } from '@google/genai';

const LiveConsultant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Visualizer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setVolume(Math.random() * 100); // Mock visualizer for demo UI
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const startSession = async () => {
    setError(null);
    setStatus('connecting');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });

      // Live Client connection
      const liveClient = getLiveClient();
      
      const sessionPromise = liveClient.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Professional consultant voice
            },
            systemInstruction: "You are a real-time divorce financial consultant. You help attorneys and clients understand financial data during meetings. Be concise, professional, and use legal terminology appropriately. Focus on California Family Code."
        },
        callbacks: {
            onopen: () => {
                setStatus('connected');
                setIsActive(true);

                // Input Processing
                const source = inputAudioCtx.createMediaStreamSource(stream);
                const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const blob = createPcmBlob(inputData);
                    sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                };

                source.connect(processor);
                processor.connect(inputAudioCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                    const ctx = audioContextRef.current;
                    // Ensure smooth playback timing
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(
                        base64ToUint8Array(base64Audio),
                        ctx,
                        24000,
                        1
                    );
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                    });
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }
            },
            onclose: () => {
                handleStop();
            },
            onerror: (e) => {
                console.error(e);
                setError("Connection error occurred");
                handleStop();
            }
        }
      });

    } catch (e) {
      console.error(e);
      setError("Failed to access microphone or connect");
      setStatus('disconnected');
    }
  };

  const handleStop = () => {
    setIsActive(false);
    setStatus('disconnected');
    
    // Cleanup
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative">
        {/* Status Bar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-medium text-white uppercase tracking-wider">
            {status === 'connected' ? 'Live Session Active' : status}
          </span>
        </div>

        {/* Main Visualizer Area */}
        <div className="h-80 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 relative">
          {status === 'connected' ? (
             <div className="flex items-center justify-center gap-1 h-16">
               {[...Array(10)].map((_, i) => (
                 <div 
                    key={i} 
                    className="w-3 bg-blue-500 rounded-full transition-all duration-75 ease-in-out"
                    style={{ height: `${Math.max(10, Math.random() * volume * 1.5)}%`, opacity: 0.8 }}
                 ></div>
               ))}
             </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
                <Radio className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm">Start session for real-time consultation</p>
            </div>
          )}

          {error && (
            <div className="absolute bottom-20 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded text-sm">
                {error}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-800 p-6 flex justify-center items-center gap-8">
          <button 
            onClick={isActive ? handleStop : startSession}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isActive ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <div className="text-center">
             <p className="text-white font-medium mb-1">Expert Consultant Mode</p>
             <p className="text-xs text-slate-400 max-w-xs">
                Real-time audio analysis of case details using native Gemini audio streaming.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveConsultant;