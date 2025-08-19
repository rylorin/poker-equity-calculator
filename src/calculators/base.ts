import { EvaluatorFactory, HandEvaluator } from "../evaluators/evaluator";
import { isCardInArray } from "../models/card";
import { Deck } from "../models/deck";
import { Board } from "../types/board";
import { Card } from "../types/card";
import { GameVariant } from "../types/game";
import { Hand } from "../types/hand";
import { CalculationOptions, EquityResult, PlayerEquity, RankCount } from "../types/result";

/**
 * Base class for equity calculators
 */
export abstract class EquityCalculator {
  protected evaluator: HandEvaluator;
  protected hands: Hand[];
  protected board: Board;
  protected deadCards: Card[];
  protected options: CalculationOptions;

  constructor(
    hands: Hand[],
    board: Board,
    deadCards: Card[] = [],
    gameVariant: GameVariant = GameVariant.TEXAS_HOLDEM,
    options: CalculationOptions = {},
  ) {
    this.hands = hands;
    this.board = board;
    this.deadCards = deadCards;
    this.evaluator = EvaluatorFactory.getEvaluator(gameVariant);
    this.options = {
      iterations: 10_000,
      forceExhaustive: false,
      maxExhaustiveCombinations: 25000,
      accuracyThreshold: 0.001,
      progressCallback: undefined,
      ...options,
    };

    this.validateHands();
  }

  /**
   * Validates that hands don't share cards and don't contain dead cards
   */
  private validateHands(): void {
    const seenCards: Card[] = [];

    // Check that board cards don't appear in hands or dead cards
    for (const card of this.board.cards) {
      if (isCardInArray(card, this.deadCards)) {
        throw new Error(`Board card ${card.rank}${card.suit} is also marked as a dead card`);
      }

      for (const hand of this.hands) {
        if (isCardInArray(card, hand.cards)) {
          throw new Error(`Board card ${card.rank}${card.suit} also appears in a player's hand`);
        }
      }

      if (isCardInArray(card, seenCards)) {
        throw new Error(`Duplicate board card: ${card.rank}${card.suit}`);
      }

      seenCards.push(card);
    }

    // Check that dead cards don't appear in hands
    for (const card of this.deadCards) {
      for (const hand of this.hands) {
        if (isCardInArray(card, hand.cards)) {
          throw new Error(`Dead card ${card.rank}${card.suit} also appears in a player's hand`);
        }
      }

      if (isCardInArray(card, seenCards)) {
        throw new Error(`Duplicate dead card: ${card.rank}${card.suit}`);
      }

      seenCards.push(card);
    }

    // Check that hands don't share cards
    for (let i = 0; i < this.hands.length; i++) {
      for (const card of this.hands[i].cards) {
        if (isCardInArray(card, seenCards)) {
          throw new Error(`Card ${card.rank}${card.suit} appears in multiple hands`);
        }

        seenCards.push(card);
      }
    }
  }

  /**
   * Gets all used cards (cards that are unavailable for dealing)
   */
  protected getUsedCards(): Card[] {
    const usedCards: Card[] = [];

    // Add board cards
    usedCards.push(...this.board.cards);

    // Add dead cards
    usedCards.push(...this.deadCards);

    // Add cards from all hands
    for (const hand of this.hands) {
      usedCards.push(...hand.cards);
    }

    return usedCards;
  }

  /**
   * Creates a deck with all used cards removed
   */
  protected createDeckWithoutUsedCards(): Deck {
    const deck = new Deck();
    deck.removeCards(this.getUsedCards());
    return deck;
  }

  /**
   * Creates initial player equity objects
   */
  protected createInitialPlayerEquities(): PlayerEquity[] {
    return this.hands.map((_, index) => ({
      handIndex: index,
      equity: 0,
      wins: 0,
      ties: 0,
      winsCount: 0,
      tiesCount: 0,
      handRankCounts: {} as RankCount,
      winningHandRankCounts: {} as RankCount,
    }));
  }

  /**
   * Abstract method to calculate equity
   */
  abstract calculate(): Promise<EquityResult>;
}

// export { EquityCalculator }
