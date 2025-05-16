import { Card } from '../types/card';
import { Board, BoardError, BoardStage, BoardString } from '../types/board';
import { createCards, cardsToString } from './card';
import { GameVariant, GAME_CONFIGS, GameError } from '../types/game';

/**
 * Creates a Board object from a string representation (e.g., 'AsKhQd')
 */
export function createBoard(boardStr: BoardString, variant: GameVariant = GameVariant.TEXAS_HOLDEM): Board {
  if (!boardStr) {
    return { cards: [] };
  }
  
  const cards = createCards(boardStr);
  validateBoard(cards, variant);
  
  return { cards };
}

/**
 * Validates that a board is valid for the given game variant
 */
export function validateBoard(cards: Card[], variant: GameVariant): void {
  const config = GAME_CONFIGS[variant];
  
  if (!config) {
    throw new GameError(`Unknown game variant: ${variant}`);
  }
  
  if (cards.length > config.maxBoardCards) {
    throw new BoardError(`Too many board cards for ${variant}: got ${cards.length}, max is ${config.maxBoardCards}`);
  }
  
  // Check for duplicate cards
  const cardMap = new Map<string, boolean>();
  for (const card of cards) {
    const cardStr = card.rank + card.suit;
    if (cardMap.has(cardStr)) {
      throw new BoardError(`Duplicate card on board: ${cardStr}`);
    }
    cardMap.set(cardStr, true);
  }
}

/**
 * Converts a Board object to its string representation
 */
export function boardToString(board: Board): BoardString {
  return cardsToString(board.cards);
}

/**
 * Determines the current stage of the game based on the board
 */
export function getBoardStage(board: Board): BoardStage {
  const cardCount = board.cards.length;
  
  if (cardCount === 0) return BoardStage.PREFLOP;
  if (cardCount === 3) return BoardStage.FLOP;
  if (cardCount === 4) return BoardStage.TURN;
  if (cardCount === 5) return BoardStage.RIVER;
  
  throw new BoardError(`Invalid board with ${cardCount} cards`);
}

/**
 * Checks if a board is complete (has all 5 cards) for community card games
 */
export function isBoardComplete(board: Board, variant: GameVariant): boolean {
  const config = GAME_CONFIGS[variant];
  return board.cards.length === config.maxBoardCards;
}

/**
 * Gets the number of cards needed to complete the board for the given game variant
 */
export function cardsNeededForBoard(board: Board, variant: GameVariant): number {
  const config = GAME_CONFIGS[variant];
  return Math.max(0, config.maxBoardCards - board.cards.length);
}