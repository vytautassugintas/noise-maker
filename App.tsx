import React, { useState } from 'react';
import { useNoiseAudio } from './hooks/useNoiseAudio';
import { Visualizer } from './components/Visualizer';
import { AudioState, NoiseColor, GeminiMoodConfig } from './types';

const App: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.5,
    noiseColor: NoiseColor.PINK,
    filterFrequency: 5000, // Default cutoff
    filterQ: 1,
  });

  const { analyserNode } = useNoiseAudio(audioState);

  const togglePlay = () => {
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleColorChange = (color: NoiseColor) => {
    setAudioState(prev => ({ ...prev, noiseColor: color }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioState(prev => ({ ...prev, volume: parseFloat(e.target.value) }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Exponential slider feel
    const val = parseFloat(e.target.value);
    // Map 0-100 to 100Hz-20000Hz roughly
    const freq = Math.floor(Math.pow(val, 3) / 10000 * 19900 + 100); 
    
    setAudioState(prev => ({ ...prev, filterFrequency: Math.max(50, Math.min(20000, freq)) }));
  };

  const handleGeminiConfig = (config: GeminiMoodConfig) => {
    setAudioState(prev => ({
      ...prev,
      isPlaying: true,
      noiseColor: config.noiseColor,
      volume: config.volume,
      filterFrequency: config.filterFrequency,
    }));
  };

  // Determine accent color based on noise type
  const accentColor = 
    audioState.noiseColor === NoiseColor.BROWN ? '#a52a2a' :
    audioState.noiseColor === NoiseColor.PINK ? '#f472b6' :
    '#38bdf8'; // White

  // Reverse calculate slider value for frequency (roughly)
  const freqSliderValue = Math.pow((audioState.filterFrequency - 100) / 19900 * 10000, 1/3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              NOISE MAKER
            </h1>
            <p className="text-slate-400 mt-2">Procedural Audio</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${audioState.isPlaying ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
            {audioState.isPlaying ? 'Active' : 'Standby'}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Visual & Controls Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visualizer */}
            <div className="relative">
              <Visualizer 
                analyser={analyserNode} 
                isPlaying={audioState.isPlaying} 
                primaryColor={accentColor}
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!audioState.isPlaying && (
                  <button 
                    onClick={togglePlay}
                    className="pointer-events-auto p-6 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all transform hover:scale-105 active:scale-95 group"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400 group-hover:text-indigo-300 ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Manual Controls */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-slate-200">Manual Tuning</h3>
                {audioState.isPlaying && (
                   <button onClick={togglePlay} className="text-xs text-red-400 hover:text-red-300 transition-colors">Stop Audio</button>
                )}
              </div>

              <div className="space-y-8">
                {/* Noise Type Selector */}
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(NoiseColor).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium capitalize transition-all ${
                        audioState.noiseColor === color 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {color} Noise
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Volume */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Intensity</span>
                      <span>{Math.round(audioState.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={audioState.volume}
                      onChange={handleVolumeChange}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Filter Frequency */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Frequency Cutoff</span>
                      <span>
                        {audioState.filterFrequency > 1000 
                          ? `${(audioState.filterFrequency / 1000).toFixed(1)} kHz` 
                          : `${Math.round(audioState.filterFrequency)} Hz`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1" // Mapped value
                      max="22" // Mapped value
                      step="0.1"
                      value={freqSliderValue || 15} 
                      onChange={handleFilterChange}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / AI Controls */}
          <div className="lg:col-span-1 space-y-8">
             {/* Info Card */}
             <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
               <h3 className="text-slate-200 font-medium mb-3">Did you know?</h3>
               <p className="text-sm text-slate-400 leading-relaxed">
                 <span className="text-indigo-400 font-medium">Pink Noise</span> decreases in power by 3 dB per octave, mirroring the frequency spectrum of natural sounds like rain, wind, and heartbeats, making it ideal for deep sleep.
               </p>
             </div>

             <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50">
               <h3 className="text-slate-200 font-medium mb-3">Spectrum</h3>
               <p className="text-sm text-slate-400 leading-relaxed">
                  Adjust the <span className="text-cyan-400 font-medium">Frequency Cutoff</span> to shape the sound. Lower frequencies (Brown noise + Low Cutoff) feel deep and warm, while higher frequencies (White + High Cutoff) are airy and crisp.
               </p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
