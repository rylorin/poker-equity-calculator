import { Card, CardString } from './card';

/**
 * Represents a player's hand in any poker variant
 */
export interface Hand {
  cards: Card[];
}

/**
 * Types of poker hand rankings
 */
export enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

/**
 * Names for hand rankings
 */
export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: 'High Card',
  [HandRank.PAIR]: 'Pair',
  [HandRank.TWO_PAIR]: 'Two Pair',
  [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandRank.STRAIGHT]: 'Straight',
  [HandRank.FLUSH]: 'Flush',
  [HandRank.FULL_HOUSE]: 'Full House',
  [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
  [HandRank.ROYAL_FLUSH]: 'Royal Flush'
};

/**
 * Represents the evaluated hand with its rank and value
 */
export interface EvaluatedHand {
  rank: HandRank;
  value: number;
  description: string;
}

/**
 * Type for hand string representation (e.g., 'AsKh', '2c2d')
 */
export type HandString = string;

/**
 * Hand validation error
 */
export class HandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandError';
  }
}