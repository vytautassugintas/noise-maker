export enum NoiseColor {
  WHITE = 'white',
  PINK = 'pink',
  BROWN = 'brown',
}

export interface AudioState {
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
  noiseColor: NoiseColor;
  filterFrequency: number; // 20Hz to 20000Hz
  filterQ: number; // Resonance
}

export interface GeminiMoodConfig {
  noiseColor: NoiseColor;
  volume: number;
  filterFrequency: number;
  description: string;
}
