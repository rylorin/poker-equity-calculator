import { cardsNeededForBoard } from "../models/board";
import { cardsNeededForHand } from "../models/hand";
import { Card } from "../types/card";
import { GAME_CONFIGS } from "../types/game";
import { EvaluatedHand } from "../types/hand";
import { EquityResult, PlayerEquity } from "../types/result";
import { generateCombinations } from "../utils/card-combinations";
import { EquityCalculator } from "./base";

/**
 * Calculator that performs an exhaustive calculation by evaluating all possible outcomes
 */
export class ExhaustiveCalculator extends EquityCalculator {
  /**
   * Calculates equity by examining all possible combinations
   */
  async calculate(): Promise<EquityResult> {
    const startTime = Date.now();

    // Calculate total combinations to evaluate all outcomes
    const { totalCombinations, maxCombinations } = this.estimateCombinations();
    const shouldUseExhaustive =
      this.options.forceExhaustive || totalCombinations <= (this.options.maxExhaustiveCombinations || 25000);

    if (!shouldUseExhaustive) {
      throw new Error(
        `Too many combinations for exhaustive calculation: ${totalCombinations}. ` +
          `Use Monte Carlo simulation instead or increase maxExhaustiveCombinations.`,
      );
    }

    // Initialize results
    const playerResults = this.createInitialPlayerEquities();
    let totalHands = 0;

    // Get the game variant configuration
    const gameVariant = this.evaluator.getVariant();
    const gameConfig = GAME_CONFIGS[gameVariant];

    // Get all cards that are in use and unavailable for dealing
    const usedCards = this.getUsedCards();

    // Create a deck with all used cards removed
    const deck = this.createDeckWithoutUsedCards();
    const remainingCards = deck.allCards;

    // Determine what needs to be dealt
    // 1. Complete each player's hand if needed
    const incompleteHands = this.hands
      .map((hand, index) => ({
        handIndex: index,
        cardsNeeded: cardsNeededForHand(hand, gameVariant),
      }))
      .filter((h) => h.cardsNeeded > 0);

    // 2. Complete the board if needed
    const boardCardsNeeded = cardsNeededForBoard(this.board, gameVariant);

    // If no cards need to be dealt, we can evaluate right away
    if (incompleteHands.length === 0 && boardCardsNeeded === 0) {
      // All hands and the board are complete, so just evaluate once
      this.evaluateAndUpdateEquity(playerResults);
      totalHands = 1;
    } else {
      // We need to deal cards to complete hands and/or the board

      // Strategy:
      // 1. Generate all possible ways to complete each hand
      // 2. Generate all possible ways to complete the board
      // 3. For each combination of completed hands and boards, evaluate

      // Generate possible completions for each incomplete hand
      const handCompletions: Card[][][] = incompleteHands.map((incompleteHand) => {
        const { handIndex, cardsNeeded } = incompleteHand;

        // We can't use cards that are already in this hand
        const handCards = this.hands[handIndex].cards;
        const availableCards = remainingCards.filter(
          (card) => !handCards.some((hc) => hc.rank === card.rank && hc.suit === card.suit),
        );

        // Generate all possible ways to complete this hand
        return generateCombinations(availableCards, cardsNeeded);
      });

      // Generate possible completions for the board
      const boardCompletions: Card[][] =
        boardCardsNeeded > 0 ? generateCombinations(remainingCards, boardCardsNeeded) : [[]];

      // Now we need to iterate through all combinations
      // For each possible way to complete each hand, and each possible board completion

      // This tracks the current combination of hand completions we're evaluating
      const currentHandCompletions: Card[][] = incompleteHands.map(() => []);

      // Recursively evaluate all combinations
      totalHands = await this.evaluateAllCombinations(
        0, // Start with the first incomplete hand
        incompleteHands,
        handCompletions,
        boardCompletions,
        currentHandCompletions,
        playerResults,
      );
    }

    // Calculate final equity percentages
    for (const result of playerResults) {
      result.equity = (result.winsCount + result.tiesCount / 2) / totalHands;
    }

    const elapsedTime = Date.now() - startTime;

    return {
      playerResults,
      totalHands,
      elapsedTime,
      isExact: true,
    };
  }

  /**
   * Estimates the total number of combinations that would need to be evaluated
   */
  private estimateCombinations(): { totalCombinations: number; maxCombinations: number } {
    const gameVariant = this.evaluator.getVariant();
    const gameConfig = GAME_CONFIGS[gameVariant];

    // Get all cards that are in use and unavailable for dealing
    const usedCards = this.getUsedCards();
    const remainingCardCount = 52 - usedCards.length;

    // Calculate how many cards we need to deal in total
    let totalCardsToDeal = 0;

    // Count cards needed to complete hands
    for (const hand of this.hands) {
      totalCardsToDeal += cardsNeededForHand(hand, gameVariant);
    }

    // Count cards needed to complete board
    totalCardsToDeal += cardsNeededForBoard(this.board, gameVariant);

    // If no cards need to be dealt, we only have one combination
    if (totalCardsToDeal === 0) {
      return { totalCombinations: 1, maxCombinations: 1 };
    }

    // Calculate the number of ways to select the required cards from the remaining deck
    let totalCombinations = 1;
    let remainingCards = remainingCardCount;

    // For each card we need to deal, calculate how many ways we can select it
    for (let i = 0; i < totalCardsToDeal; i++) {
      totalCombinations *= remainingCards;
      remainingCards--;
    }

    // Divide by the number of ways to order the cards (since order doesn't matter)
    totalCombinations /= factorial(totalCardsToDeal);

    // Get the maximum number of combinations to allow
    const maxCombinations = this.options.maxExhaustiveCombinations || 25000;

    return { totalCombinations, maxCombinations };
  }

  /**
   * Recursively evaluates all possible combinations of completed hands and boards
   */
  private async evaluateAllCombinations(
    handIndex: number,
    incompleteHands: { handIndex: number; cardsNeeded: number }[],
    handCompletions: Card[][][],
    boardCompletions: Card[][],
    currentHandCompletions: Card[][],
    playerResults: PlayerEquity[],
  ): Promise<number> {
    console.log("evaluateAllCombinations starting", new Date());
    // If we've assigned completions for all hands, evaluate all board completions
    if (handIndex >= incompleteHands.length) {
      let count = 0;

      // For each possible board completion, evaluate
      for (const boardCompletion of boardCompletions) {
        // Apply the current hand and board completions
        this.applyCompletions(incompleteHands, currentHandCompletions, boardCompletion);

        // Evaluate and update equity
        this.evaluateAndUpdateEquity(playerResults);
        count++;

        // Report progress if a callback is provided
        if (this.options.progressCallback && count % 1000 === 0) {
          this.options.progressCallback(count / boardCompletions.length);
        }
      }

      console.log("evaluateAllCombinations done", new Date(), count);
      return count;
    }

    // Otherwise, try each possible completion for the current hand
    let totalCount = 0;
    const currentHandInfo = incompleteHands[handIndex];
    const completionsForCurrentHand = handCompletions[handIndex];

    for (const completion of completionsForCurrentHand) {
      // Check if these cards conflict with any previously assigned completions
      let hasConflict = false;

      for (let i = 0; i < handIndex; i++) {
        const previousCompletion = currentHandCompletions[i];

        for (const card of completion) {
          if (previousCompletion.some((pc) => pc.rank === card.rank && pc.suit === card.suit)) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) break;
      }

      if (!hasConflict) {
        // Assign this completion to the current hand
        currentHandCompletions[handIndex] = completion;

        // Recursively evaluate the next hand
        const count = await this.evaluateAllCombinations(
          handIndex + 1,
          incompleteHands,
          handCompletions,
          boardCompletions,
          currentHandCompletions,
          playerResults,
        );

        totalCount += count;
      }
    }

    console.log("evaluateAllCombinations all done", new Date(), totalCount);
    return totalCount;
  }

  /**
   * Applies the current hand and board completions to the actual hands and board
   */
  private applyCompletions(
    incompleteHands: { handIndex: number; cardsNeeded: number }[],
    handCompletions: Card[][],
    boardCompletion: Card[],
  ): void {
    // Make deep copies of the original hands and board
    const originalHands = this.hands.map((hand) => ({ ...hand, cards: [...hand.cards] }));
    const originalBoard = { ...this.board, cards: [...this.board.cards] };

    // Apply hand completions
    for (let i = 0; i < incompleteHands.length; i++) {
      const { handIndex } = incompleteHands[i];
      this.hands[handIndex].cards = [...originalHands[handIndex].cards, ...handCompletions[i]];
    }

    // Apply board completion
    this.board.cards = [...originalBoard.cards, ...boardCompletion];
  }

  /**
   * Evaluates the current state and updates equity tallies
   */
  private evaluateAndUpdateEquity(playerResults: PlayerEquity[]): void {
    // Evaluate each player's hand
    const evaluatedHands: EvaluatedHand[] = this.hands.map((hand) =>
      this.evaluator.evaluate(hand.cards, this.board.cards),
    );

    // Determine the winner(s)
    let bestHandValue = -1;
    let winners: number[] = [];

    for (let i = 0; i < evaluatedHands.length; i++) {
      const handValue = evaluatedHands[i].value;
      const handRank = evaluatedHands[i].rank;

      // Update the hand rank count for this player
      if (!playerResults[i].handRankCounts[handRank]) {
        playerResults[i].handRankCounts[handRank] = 0;
      }
      playerResults[i].handRankCounts[handRank]++;

      if (handValue > bestHandValue) {
        bestHandValue = handValue;
        winners = [i];
      } else if (handValue === bestHandValue) {
        winners.push(i);
      }
    }

    // Update win/tie counts
    if (winners.length === 1) {
      // Single winner
      playerResults[winners[0]].winsCount++;

      // Update winning hand rank count
      const winningRank = evaluatedHands[winners[0]].rank;
      if (!playerResults[winners[0]].winningHandRankCounts[winningRank]) {
        playerResults[winners[0]].winningHandRankCounts[winningRank] = 0;
      }
      playerResults[winners[0]].winningHandRankCounts[winningRank]++;
    } else {
      // Multiple winners (tie)
      for (const winner of winners) {
        playerResults[winner].tiesCount++;

        // Update winning hand rank count for ties
        const tiedRank = evaluatedHands[winner].rank;
        if (!playerResults[winner].winningHandRankCounts[tiedRank]) {
          playerResults[winner].winningHandRankCounts[tiedRank] = 0;
        }
        playerResults[winner].winningHandRankCounts[tiedRank] += 1 / winners.length;
      }
    }
  }
}

/**
 * Helper function to calculate factorial
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
