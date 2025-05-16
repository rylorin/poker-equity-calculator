import { Card } from '../types/card';
import { EvaluatedHand, HandRank } from '../types/hand';
import { GameVariant } from '../types/game';

/**
 * Base interface for hand evaluators
 * Each game variant will implement its own evaluator
 */
export interface HandEvaluator {
  /**
   * Evaluates the best possible hand from the given hole cards and board
   */
  evaluate(holeCards: Card[], boardCards: Card[]): EvaluatedHand;
  
  /**
   * Compares two evaluated hands and determines the winner
   * Returns:
   *  1 if hand1 is better than hand2
   *  0 if the hands are equal
   * -1 if hand2 is better than hand1
   */
  compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): number;
  
  /**
   * Gets the game variant this evaluator is for
   */
  getVariant(): GameVariant;
}

/**
 * Factory for creating the appropriate evaluator for a game variant
 */
export class EvaluatorFactory {
  private static evaluators = new Map<GameVariant, HandEvaluator>();
  
  /**
   * Registers an evaluator for a game variant
   */
  static register(variant: GameVariant, evaluator: HandEvaluator): void {
    EvaluatorFactory.evaluators.set(variant, evaluator);
  }
  
  /**
   * Gets the evaluator for a game variant
   */
  static getEvaluator(variant: GameVariant): HandEvaluator {
    const evaluator = EvaluatorFactory.evaluators.get(variant);
    if (!evaluator) {
      throw new Error(`No evaluator registered for variant: ${variant}`);
    }
    return evaluator;
  }
}

/**
 * Base class for hand evaluators with common functionality
 */
export abstract class BaseEvaluator implements HandEvaluator {
  abstract evaluate(holeCards: Card[], boardCards: Card[]): EvaluatedHand;
  abstract getVariant(): GameVariant;
  
  /**
   * Compares two evaluated hands
   */
  compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): number {
    if (hand1.rank > hand2.rank) return 1;
    if (hand1.rank < hand2.rank) return -1;
    
    // If the ranks are the same, compare the values
    if (hand1.value > hand2.value) return 1;
    if (hand1.value < hand2.value) return -1;
    
    return 0; // The hands are equal
  }
  
  /**
   * Generates a description for an evaluated hand
   */
  protected getHandDescription(handRank: HandRank, cards: Card[]): string {
    // This would be implemented in each evaluator to provide
    // detailed descriptions of hands (e.g., "Pair of Aces with King kicker")
    return "";
  }
}

// export { BaseEvaluator }