export enum FishType {
  NORMAL = 'NORMAL',
  GLITCH = 'GLITCH',
  MIRROR = 'MIRROR' // Represents the player/wildcard
}

export enum GamePhase {
  INTRO = 'INTRO',
  TUTORIAL = 'TUTORIAL',
  PLAYING = 'PLAYING',
  OVERWHELMED_ENDING = 'OVERWHELMED_ENDING', // Too much chaos (Legacy, redirects to NAMING)
  NAMING_ENDING = 'NAMING_ENDING', // The moment of naming
  FINAL_REFLECTION = 'FINAL_REFLECTION' // The final text
}

export enum RuleType {
  COLOR_RED = 'COLOR_RED',
  COLOR_BLUE = 'COLOR_BLUE',
  SHAPE_ROUND = 'SHAPE_ROUND',
  SHAPE_SHARP = 'SHAPE_SHARP',
  SOUL = 'SOUL' // Impossible rule
}

export interface Fish {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: 'round' | 'sharp';
  type: FishType;
  scale: number;
  rotation: number;
  locked: boolean; 
  name?: string;
  isCollected?: boolean;
}

export interface GameState {
  phase: GamePhase;
  chaosLevel: number; // 0 to 100
  score: number;
  currentRule: RuleType;
  ruleTimer: number; // Seconds remaining for current rule
  message: string;
}

export interface VisionState {
  isPresent: boolean;
  expression: 'neutral' | 'smile' | 'frown' | 'surprise';
  gesture: 'none' | 'open_palm' | 'circle' | 'point';
  lastUpdated: number;
}