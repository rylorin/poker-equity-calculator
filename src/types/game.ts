/**
 * Represents different poker game variants
 */
export enum GameVariant {
  TEXAS_HOLDEM = 'texas_holdem',
  OMAHA = 'omaha',
  OMAHA_HI_LO = 'omaha_hi_lo',
  SEVEN_CARD_STUD = 'seven_card_stud',
  FIVE_CARD_DRAW = 'five_card_draw'
}

/**
 * Configuration for hand limits in different game variants
 */
export interface GameConfig {
  minHoleCards: number;
  maxHoleCards: number;
  minBoardCards: number;
  maxBoardCards: number;
  cardsUsedInHand: number;
}

/**
 * Game variant configuration map
 */
export const GAME_CONFIGS: Record<GameVariant, GameConfig> = {
  [GameVariant.TEXAS_HOLDEM]: {
    minHoleCards: 2,
    maxHoleCards: 2,
    minBoardCards: 0,
    maxBoardCards: 5,
    cardsUsedInHand: 5
  },
  [GameVariant.OMAHA]: {
    minHoleCards: 4,
    maxHoleCards: 4,
    minBoardCards: 0,
    maxBoardCards: 5,
    cardsUsedInHand: 5
  },
  [GameVariant.OMAHA_HI_LO]: {
    minHoleCards: 4,
    maxHoleCards: 4,
    minBoardCards: 0,
    maxBoardCards: 5,
    cardsUsedInHand: 5
  },
  [GameVariant.SEVEN_CARD_STUD]: {
    minHoleCards: 2,
    maxHoleCards: 7,
    minBoardCards: 0,
    maxBoardCards: 0,
    cardsUsedInHand: 5
  },
  [GameVariant.FIVE_CARD_DRAW]: {
    minHoleCards: 5,
    maxHoleCards: 5,
    minBoardCards: 0,
    maxBoardCards: 0,
    cardsUsedInHand: 5
  }
};

/**
 * Game validation error
 */
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}