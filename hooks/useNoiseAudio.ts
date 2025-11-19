import { useEffect, useRef, useCallback } from 'react';
import { AudioState, NoiseColor } from '../types';

// Helper to generate noise buffers
const createNoiseBuffer = (ctx: AudioContext, type: NoiseColor): AudioBuffer => {
  const bufferSize = ctx.sampleRate * 5; // 5 seconds loop
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);

  if (type === NoiseColor.WHITE) {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === NoiseColor.PINK) {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // Compensate for gain
      b6 = white * 0.115926;
    }
  } else if (type === NoiseColor.BROWN) {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain
    }
  }
  return buffer;
};

export const useNoiseAudio = (state: AudioState) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const buffersRef = useRef<Record<NoiseColor, AudioBuffer | null>>({
    [NoiseColor.WHITE]: null,
    [NoiseColor.PINK]: null,
    [NoiseColor.BROWN]: null,
  });

  // Initialize AudioContext
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    
    // Create Nodes
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const analyser = ctx.createAnalyser();
    
    filter.type = 'lowpass';
    analyser.fftSize = 2048;

    // Connect graph: Source (later) -> Filter -> Gain -> Analyser -> Destination
    filter.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    gainNodeRef.current = gain;
    filterNodeRef.current = filter;
    analyserNodeRef.current = analyser;

    // Pre-generate buffers
    Object.values(NoiseColor).forEach((color) => {
      buffersRef.current[color] = createNoiseBuffer(ctx, color);
    });

    return () => {
      ctx.close();
    };
  }, []);

  // Handle Play/Stop and Color Change
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const gain = gainNodeRef.current;
    const filter = filterNodeRef.current;

    if (!ctx || !gain || !filter) return;

    // If stopping or changing color, stop existing source
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (state.isPlaying) {
      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const buffer = buffersRef.current[state.noiseColor];
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(filter);
        source.start();
        sourceNodeRef.current = source;
        
        // Ramp up volume to avoid pop
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(state.volume, ctx.currentTime + 0.1);
      }
    } else {
        // Ramp down if stopping
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    }
  }, [state.isPlaying, state.noiseColor]);

  // Handle Parameter Changes (Volume, Filter) without restarting source
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const gain = gainNodeRef.current;
    const filter = filterNodeRef.current;
    
    if (!ctx || !gain || !filter) return;

    if (state.isPlaying) {
        gain.gain.setTargetAtTime(state.volume, ctx.currentTime, 0.1);
    }
    
    filter.frequency.setTargetAtTime(state.filterFrequency, ctx.currentTime, 0.1);
    filter.Q.setTargetAtTime(state.filterQ, ctx.currentTime, 0.1);

  }, [state.volume, state.filterFrequency, state.filterQ, state.isPlaying]);

  return { analyserNode: analyserNodeRef.current };
};
