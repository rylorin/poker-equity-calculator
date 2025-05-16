import { Card } from '../types/card';
import { Hand, HandError, HandString } from '../types/hand';
import { createCard, createCards, cardsToString } from './card';
import { GameVariant, GAME_CONFIGS, GameError } from '../types/game';

/**
 * Creates a Hand object from a string representation (e.g., 'AsKh')
 */
export function createHand(handStr: HandString, variant: GameVariant = GameVariant.TEXAS_HOLDEM): Hand {
  if (!handStr) {
    return { cards: [] };
  }
  
  const cards = createCards(handStr);
  validateHand(cards, variant);
  
  return { cards };
}

/**
 * Validates that a hand is valid for the given game variant
 */
export function validateHand(cards: Card[], variant: GameVariant): void {
  const config = GAME_CONFIGS[variant];
  
  if (!config) {
    throw new GameError(`Unknown game variant: ${variant}`);
  }
  
  if (cards.length > config.maxHoleCards) {
    throw new HandError(`Too many hole cards for ${variant}: got ${cards.length}, max is ${config.maxHoleCards}`);
  }
  
  // Check for duplicate cards
  const cardMap = new Map<string, boolean>();
  for (const card of cards) {
    const cardStr = card.rank + card.suit;
    if (cardMap.has(cardStr)) {
      throw new HandError(`Duplicate card in hand: ${cardStr}`);
    }
    cardMap.set(cardStr, true);
  }
}

/**
 * Converts a Hand object to its string representation
 */
export function handToString(hand: Hand): HandString {
  return cardsToString(hand.cards);
}

/**
 * Checks if a hand is complete for the given game variant
 */
export function isHandComplete(hand: Hand, variant: GameVariant): boolean {
  const config = GAME_CONFIGS[variant];
  return hand.cards.length === config.maxHoleCards;
}

/**
 * Gets the number of cards needed to complete a hand for the given game variant
 */
export function cardsNeededForHand(hand: Hand, variant: GameVariant): number {
  const config = GAME_CONFIGS[variant];
  return Math.max(0, config.maxHoleCards - hand.cards.length);
}