import { Card, CardString } from './card';

/**
 * Represents the community cards on the board
 */
export interface Board {
  cards: Card[];
}

/**
 * Type for board string representation (e.g., 'AsKhQd')
 */
export type BoardString = string;

/**
 * The possible stages of a poker game based on the board
 */
export enum BoardStage {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river'
}

/**
 * Board validation error
 */
export class BoardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardError';
  }
}