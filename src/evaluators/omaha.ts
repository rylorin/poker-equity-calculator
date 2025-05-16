import { Card } from '../types/card';
import { EvaluatedHand, HandRank } from '../types/hand';
import { GameVariant } from '../types/game';
import { BaseEvaluator, EvaluatorFactory } from './evaluator';
import { 
  sortCardsByRank,
  calculateHandValue,
  generateHandDescription
} from './hand-value';
import { generateCombinations } from '../utils/card-combinations';

/**
 * Evaluator for Omaha poker hands
 * In Omaha, a player MUST use exactly 2 cards from their hand and 3 from the board
 */
export class OmahaEvaluator extends BaseEvaluator {
  /**
   * Evaluates the best possible 5-card hand from 4 hole cards + board cards
   * Must use exactly 2 hole cards and 3 board cards
   */
  evaluate(holeCards: Card[], boardCards: Card[]): EvaluatedHand {
    if (holeCards.length !== 4) {
      throw new Error(`Omaha requires exactly 4 hole cards, got ${holeCards.length}`);
    }
    
    if (boardCards.length < 3) {
      throw new Error(`Need at least 3 board cards for Omaha, got ${boardCards.length}`);
    }
    
    // Generate all possible 2-card combinations from hole cards
    const holeCombinations = generateCombinations(holeCards, 2);
    
    // Generate all possible 3-card combinations from board cards
    const boardCombinations = generateCombinations(boardCards, 3);
    
    // Evaluate each possible combination
    let bestHand: EvaluatedHand = {
      rank: HandRank.HIGH_CARD,
      value: 0,
      description: ""
    };
    
    // Try each combination of 2 hole cards and 3 board cards
    for (const holeCombo of holeCombinations) {
      for (const boardCombo of boardCombinations) {
        // Combine the cards
        const handCards = [...holeCombo, ...boardCombo];
        
        // Use the Hold'em evaluator for the 5-card evaluation
        const holdemEvaluator = EvaluatorFactory.getEvaluator(GameVariant.TEXAS_HOLDEM);
        const evaluated = holdemEvaluator.evaluate(holeCombo, boardCombo);
        
        // If this hand is better than our current best, update the best hand
        if (evaluated.value > bestHand.value) {
          bestHand = evaluated;
        }
      }
    }
    
    return bestHand;
  }
  
  /**
   * Gets the game variant for this evaluator
   */
  getVariant(): GameVariant {
    return GameVariant.OMAHA;
  }
}

// Register the evaluator with the factory
EvaluatorFactory.register(GameVariant.OMAHA, new OmahaEvaluator());