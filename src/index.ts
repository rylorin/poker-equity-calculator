import { Card, CardString, Rank, Suit } from './types/card';
import { Hand, HandRank, EvaluatedHand } from './types/hand';
import { Board, BoardStage } from './types/board';
import { GameVariant } from './types/game';
import { EquityResult, CalculationOptions } from './types/result';

import { createCard, createCards, cardToString } from './models/card';
import { createHand, handToString, isHandComplete } from './models/hand';
import { createBoard, boardToString, getBoardStage } from './models/board';
import { Deck } from './models/deck';

import { EvaluatorFactory } from './evaluators/evaluator';
import { MonteCarloCalculator } from './calculators/monte-carlo';
import { ExhaustiveCalculator } from './calculators/exhaustive';

// Import evaluators to ensure they're registered
import './evaluators/holdem';
import './evaluators/omaha';

/**
 * Main class for poker equity calculation
 */
export class PokerEquityCalculator {
  private hands: Hand[] = [];
  private board: Board = { cards: [] };
  private deadCards: Card[] = [];
  private gameVariant: GameVariant = GameVariant.TEXAS_HOLDEM;
  
  /**
   * Creates a new equity calculator instance
   */
  constructor(gameVariant: GameVariant = GameVariant.TEXAS_HOLDEM) {
    this.gameVariant = gameVariant;
  }
  
  /**
   * Sets the game variant
   */
  setGameVariant(variant: GameVariant): this {
    this.gameVariant = variant;
    return this;
  }
  
  /**
   * Adds a player hand
   */
  addHand(handStr: string): this {
    const hand = createHand(handStr, this.gameVariant);
    this.hands.push(hand);
    return this;
  }
  
  /**
   * Sets the community board
   */
  setBoard(boardStr: string): this {
    this.board = createBoard(boardStr, this.gameVariant);
    return this;
  }
  
  /**
   * Adds dead cards (cards that are known to be unavailable)
   */
  addDeadCards(cardsStr: string): this {
    const cards = createCards(cardsStr);
    this.deadCards.push(...cards);
    return this;
  }
  
  /**
   * Clears all player hands
   */
  clearHands(): this {
    this.hands = [];
    return this;
  }
  
  /**
   * Clears the board
   */
  clearBoard(): this {
    this.board = { cards: [] };
    return this;
  }
  
  /**
   * Clears dead cards
   */
  clearDeadCards(): this {
    this.deadCards = [];
    return this;
  }
  
  /**
   * Resets everything (hands, board, dead cards)
   */
  reset(): this {
    this.hands = [];
    this.board = { cards: [] };
    this.deadCards = [];
    return this;
  }
  
  /**
   * Calculates equity for all player hands
   */
  async calculateEquity(options: CalculationOptions = {}): Promise<EquityResult> {
    if (this.hands.length < 2) {
      throw new Error('At least two player hands are required for equity calculation');
    }
    
    // Determine whether to use Monte Carlo or exhaustive calculation
    const { totalCombinations } = this.estimateCombinations();
    const shouldUseExhaustive = 
      options.forceExhaustive || 
      totalCombinations <= (options.maxExhaustiveCombinations || 25000);
    
    if (shouldUseExhaustive) {
      // Use exhaustive calculation for exact results
      const calculator = new ExhaustiveCalculator(
        this.hands,
        this.board,
        this.deadCards,
        this.gameVariant,
        options
      );
      return calculator.calculate();
    } else {
      // Use Monte Carlo simulation for large combinations
      const calculator = new MonteCarloCalculator(
        this.hands,
        this.board,
        this.deadCards,
        this.gameVariant,
        options
      );
      return calculator.calculate();
    }
  }
  
  /**
   * Estimates the number of combinations that would need to be evaluated
   */
  private estimateCombinations(): { totalCombinations: number } {
    // Count cards that are already used
    const usedCardCount = 
      this.board.cards.length + 
      this.deadCards.length + 
      this.hands.reduce((sum, hand) => sum + hand.cards.length, 0);
    
    // Count how many more cards need to be dealt
    let cardsNeeded = 0;
    
    // Determine how many more board cards are needed (up to 5 total)
    const boardCardsNeeded = 5 - this.board.cards.length;
    if (boardCardsNeeded > 0) {
      cardsNeeded += boardCardsNeeded;
    }
    
    // Add cards needed to complete each hand
    for (const hand of this.hands) {
      const handCardsNeeded = (this.gameVariant === GameVariant.OMAHA ? 4 : 2) - hand.cards.length;
      if (handCardsNeeded > 0) {
        cardsNeeded += handCardsNeeded;
      }
    }
    
    // Calculate combinations
    if (cardsNeeded === 0) {
      return { totalCombinations: 1 };
    }
    
    // Number of remaining cards in the deck
    const remainingCards = 52 - usedCardCount;
    
    // Calculate n choose k: ways to choose cardsNeeded from remainingCards
    let combinations = 1;
    for (let i = 0; i < cardsNeeded; i++) {
      combinations *= (remainingCards - i) / (i + 1);
    }
    
    return { totalCombinations: Math.round(combinations) };
  }
  
  /**
   * Evaluates a specific hand against the current board
   */
  evaluateHand(handStr: string): EvaluatedHand {
    const hand = createHand(handStr, this.gameVariant);
    const evaluator = EvaluatorFactory.getEvaluator(this.gameVariant);
    return evaluator.evaluate(hand.cards, this.board.cards);
  }
}

// Export all the necessary types and functions
export {
  // Types
  Card, CardString, Rank, Suit,
  Hand, HandRank, EvaluatedHand,
  Board, BoardStage,
  GameVariant,
  EquityResult, CalculationOptions,
  
  // Functions
  createCard, createCards, cardToString,
  createHand, handToString,
  createBoard, boardToString, getBoardStage,
  
  // Classes
  Deck,
  EvaluatorFactory,
  MonteCarloCalculator,
  ExhaustiveCalculator
};