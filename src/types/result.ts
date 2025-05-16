import { HandRank } from './hand';

/**
 * Represents the equity calculation result for a single player
 */
export interface PlayerEquity {
  handIndex: number;
  equity: number;
  wins: number;
  ties: number;
  handRankCounts: Record<HandRank, number>;
  winningHandRankCounts: Record<HandRank, number>;
}

/**
 * Represents the detailed results of an equity calculation
 */
export interface EquityResult {
  playerResults: PlayerEquity[];
  totalHands: number;
  elapsedTime: number;
  isExact: boolean;
}

/**
 * Options for controlling the equity calculation
 */
export interface CalculationOptions {
  /**
   * Maximum number of iterations for Monte Carlo simulation
   */
  iterations?: number;
  
  /**
   * Set to true to force exhaustive calculation even with many combinations
   */
  forceExhaustive?: boolean;
  
  /**
   * Maximum combinations before switching to Monte Carlo (default: 25,000)
   */
  maxExhaustiveCombinations?: number;
  
  /**
   * Accuracy threshold for Monte Carlo to stop early (0.0 - 1.0)
   */
  accuracyThreshold?: number;
  
  /**
   * Function to report progress during calculation
   */
  progressCallback?: (percent: number) => void;
}