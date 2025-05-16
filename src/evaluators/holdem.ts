import { Card } from '../types/card';
import { EvaluatedHand, HandRank } from '../types/hand';
import { GameVariant } from '../types/game';
import { BaseEvaluator, EvaluatorFactory } from './evaluator';
import { 
  sortCardsByRank, 
  countRanks, 
  findStraight, 
  findFlush, 
  calculateHandValue,
  generateHandDescription
} from './hand-value';
import { generateCombinations } from '../utils/card-combinations';

/**
 * Evaluator for Texas Hold'em poker hands
 */
export class HoldemEvaluator extends BaseEvaluator {
  /**
   * Evaluates the best possible 5-card hand from 7 cards (2 hole cards + 5 board cards)
   */
  evaluate(holeCards: Card[], boardCards: Card[]): EvaluatedHand {
    const allCards = [...holeCards, ...boardCards];
    
    // A player must use exactly 2 hole cards in Texas Hold'em
    if (allCards.length < 5) {
      throw new Error(`Not enough cards to evaluate: got ${allCards.length}, need at least 5`);
    }
    
    // Generate all possible 5-card combinations
    const combinations = generateCombinations(allCards, 5);
    
    // Evaluate each combination and keep the best one
    let bestHand: EvaluatedHand = {
      rank: HandRank.HIGH_CARD,
      value: 0,
      description: ""
    };
    
    for (const combo of combinations) {
      const evaluated = this.evaluateSingleHand(combo);
      
      // If this hand is better than our current best, update the best hand
      if (evaluated.value > bestHand.value) {
        bestHand = evaluated;
      }
    }
    
    return bestHand;
  }
  
  /**
   * Evaluates a single 5-card hand
   */
  private evaluateSingleHand(cards: Card[]): EvaluatedHand {
    if (cards.length !== 5) {
      throw new Error(`Exactly 5 cards required for evaluation, got ${cards.length}`);
    }
    
    // Sort cards by rank (high to low)
    const sortedCards = sortCardsByRank(cards);
    
    // Count occurrences of each rank
    const rankCounts = countRanks(cards);
    
    // Check for flush
    const flush = findFlush(cards);
    
    // Check for straight
    const straight = findStraight(cards);
    
    // Determine hand rank
    let handRank: HandRank;
    let valueCards: Card[] = sortedCards;
    
    // Royal flush: A-K-Q-J-T of the same suit
    if (
      flush && 
      sortedCards[0].rank === 'A' && 
      sortedCards[1].rank === 'K' && 
      sortedCards[2].rank === 'Q' && 
      sortedCards[3].rank === 'J' && 
      sortedCards[4].rank === 'T'
    ) {
      handRank = HandRank.ROYAL_FLUSH;
      valueCards = sortedCards;
    }
    // Straight flush: Five cards of sequential rank, all the same suit
    else if (flush && straight) {
      handRank = HandRank.STRAIGHT_FLUSH;
      valueCards = straight;
    }
    // Four of a kind: Four cards of the same rank
    else if (Array.from(rankCounts.values()).includes(4)) {
      handRank = HandRank.FOUR_OF_A_KIND;
      
      // Order cards with the quad first, then the kicker
      valueCards = [];
      let quadRank: string | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 4) {
          quadRank = rank;
          break;
        }
      }
      
      // Add the quad cards first
      for (const card of sortedCards) {
        if (card.rank === quadRank) {
          valueCards.push(card);
        }
      }
      
      // Add the kicker
      for (const card of sortedCards) {
        if (card.rank !== quadRank) {
          valueCards.push(card);
        }
      }
    }
    // Full house: Three cards of one rank and two of another
    else if (
      Array.from(rankCounts.values()).includes(3) && 
      Array.from(rankCounts.values()).includes(2)
    ) {
      handRank = HandRank.FULL_HOUSE;
      
      // Order cards with the trips first, then the pair
      valueCards = [];
      let tripRank: string | null = null;
      let pairRank: string | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 3) tripRank = rank;
        else if (count === 2) pairRank = rank;
      }
      
      // Add the trip cards first
      for (const card of sortedCards) {
        if (card.rank === tripRank) {
          valueCards.push(card);
        }
      }
      
      // Add the pair cards
      for (const card of sortedCards) {
        if (card.rank === pairRank) {
          valueCards.push(card);
        }
      }
    }
    // Flush: Five cards of the same suit
    else if (flush) {
      handRank = HandRank.FLUSH;
      valueCards = flush;
    }
    // Straight: Five cards of sequential rank
    else if (straight) {
      handRank = HandRank.STRAIGHT;
      valueCards = straight;
    }
    // Three of a kind: Three cards of the same rank
    else if (Array.from(rankCounts.values()).includes(3)) {
      handRank = HandRank.THREE_OF_A_KIND;
      
      // Order cards with the trips first, then the kickers in descending order
      valueCards = [];
      let tripRank: string | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 3) {
          tripRank = rank;
          break;
        }
      }
      
      // Add the trip cards first
      for (const card of sortedCards) {
        if (card.rank === tripRank) {
          valueCards.push(card);
        }
      }
      
      // Add the kickers in descending order
      for (const card of sortedCards) {
        if (card.rank !== tripRank) {
          valueCards.push(card);
        }
      }
    }
    // Two pair: Two cards of one rank, two of another, and one kicker
    else if (Array.from(rankCounts.values()).filter(count => count === 2).length === 2) {
      handRank = HandRank.TWO_PAIR;
      
      // Order cards with pairs first (higher pair first), then the kicker
      valueCards = [];
      const pairRanks: string[] = [];
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 2) {
          pairRanks.push(rank);
        }
      }
      
      // Sort pair ranks in descending order
      pairRanks.sort((a, b) => {
        const aValue = sortedCards.find(card => card.rank === a)!;
        const bValue = sortedCards.find(card => card.rank === b)!;
        return sortedCards.indexOf(aValue) - sortedCards.indexOf(bValue);
      });
      
      // Add the higher pair first
      for (const card of sortedCards) {
        if (card.rank === pairRanks[0]) {
          valueCards.push(card);
        }
      }
      
      // Add the lower pair
      for (const card of sortedCards) {
        if (card.rank === pairRanks[1]) {
          valueCards.push(card);
        }
      }
      
      // Add the kicker
      for (const card of sortedCards) {
        if (card.rank !== pairRanks[0] && card.rank !== pairRanks[1]) {
          valueCards.push(card);
        }
      }
    }
    // Pair: Two cards of the same rank, and three kickers
    else if (Array.from(rankCounts.values()).includes(2)) {
      handRank = HandRank.PAIR;
      
      // Order cards with the pair first, then the kickers in descending order
      valueCards = [];
      let pairRank: string | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 2) {
          pairRank = rank;
          break;
        }
      }
      
      // Add the pair cards first
      for (const card of sortedCards) {
        if (card.rank === pairRank) {
          valueCards.push(card);
        }
      }
      
      // Add the kickers in descending order
      for (const card of sortedCards) {
        if (card.rank !== pairRank) {
          valueCards.push(card);
        }
      }
    }
    // High card: Just the highest card with four kickers
    else {
      handRank = HandRank.HIGH_CARD;
      valueCards = sortedCards;
    }
    
    // Calculate hand value for comparison
    const value = calculateHandValue(handRank, valueCards);
    
    // Generate a human-readable description
    const description = generateHandDescription(handRank, valueCards);
    
    return {
      rank: handRank,
      value,
      description
    };
  }
  
  /**
   * Gets the game variant for this evaluator
   */
  getVariant(): GameVariant {
    return GameVariant.TEXAS_HOLDEM;
  }
}

// Register the evaluator with the factory
EvaluatorFactory.register(GameVariant.TEXAS_HOLDEM, new HoldemEvaluator());