/**
 * Represents card suits in a standard deck
 */
export enum Suit {
  SPADES = 's',
  HEARTS = 'h',
  DIAMONDS = 'd',
  CLUBS = 'c'
}

/**
 * Represents card ranks in a standard deck
 */
export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = 'T',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A'
}

/**
 * Card representation using rank and suit
 */
export interface Card {
  rank: Rank;
  suit: Suit;
}

/**
 * Type for card string representation (e.g., 'As', 'Th', '2c')
 */
export type CardString = string;

/**
 * Numeric value assigned to each rank for comparison
 */
export const RANK_VALUES: Record<Rank, number> = {
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 11,
  [Rank.QUEEN]: 12,
  [Rank.KING]: 13,
  [Rank.ACE]: 14
};

/**
 * Card validation error
 */
export class CardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardError';
  }
}