import { Card } from '../types/card';
import { Hand, HandRank, EvaluatedHand } from '../types/hand';
import { Board } from '../types/board';
import { GameVariant, GAME_CONFIGS } from '../types/game';
import { EquityResult, CalculationOptions, PlayerEquity } from '../types/result';
import { EquityCalculator } from './base';
import { Deck } from '../models/deck';
import { cardsNeededForHand } from '../models/hand';
import { cardsNeededForBoard } from '../models/board';
import { getRandomCombination } from '../utils/card-combinations';

/**
 * Calculator that uses Monte Carlo simulation to estimate equity
 */
export class MonteCarloCalculator extends EquityCalculator {
  /**
   * Calculates equity by running random simulations
   */
  async calculate(): Promise<EquityResult> {
    const startTime = Date.now();
    
    // Get the maximum number of iterations to run
    const maxIterations = this.options.iterations || 100000;
    
    // Initialize results
    const playerResults = this.createInitialPlayerEquities();
    let iterationsCompleted = 0;
    
    // Get the game variant configuration
    const gameVariant = this.evaluator.getVariant();
    const gameConfig = GAME_CONFIGS[gameVariant];
    
    // Keep track of previous equity results to check for convergence
    const previousEquities: number[][] = [];
    const convergenceWindow = 10; // Number of previous results to check
    
    // Run simulations until we reach the maximum or achieve desired accuracy
    while (iterationsCompleted < maxIterations) {
      // Run a batch of simulations
      const batchSize = 1000;
      const batchesToRun = Math.min(batchSize, maxIterations - iterationsCompleted);
      
      await this.runSimulationBatch(batchesToRun, playerResults);
      
      iterationsCompleted += batchesToRun;
      
      // Calculate current equities
      const currentEquities = playerResults.map(result => 
        (result.wins + result.ties / 2) / iterationsCompleted
      );
      
      // Check for convergence if we have enough iterations and a threshold is set
      if (
        iterationsCompleted > convergenceWindow * batchSize && 
        this.options.accuracyThreshold && 
        previousEquities.length >= convergenceWindow
      ) {
        let hasConverged = true;
        
        // Check if all equities have stabilized
        for (let i = 0; i < currentEquities.length; i++) {
          const equity = currentEquities[i];
          
          // Check against the previous windows
          for (let j = 1; j <= convergenceWindow; j++) {
            const previousEquity = previousEquities[previousEquities.length - j][i];
            const difference = Math.abs(equity - previousEquity);
            
            if (difference > this.options.accuracyThreshold) {
              hasConverged = false;
              break;
            }
          }
          
          if (!hasConverged) break;
        }
        
        if (hasConverged) {
          // We've reached the desired accuracy
          break;
        }
      }
      
      // Keep track of previous equities
      previousEquities.push(currentEquities);
      if (previousEquities.length > convergenceWindow) {
        previousEquities.shift();
      }
      
      // Report progress if a callback is provided
      if (this.options.progressCallback) {
        this.options.progressCallback(iterationsCompleted / maxIterations);
      }
    }
    
    // Calculate final equity percentages
    for (const result of playerResults) {
      result.equity = (result.wins + result.ties / 2) / iterationsCompleted;
    }
    
    const elapsedTime = Date.now() - startTime;
    
    return {
      playerResults,
      totalHands: iterationsCompleted,
      elapsedTime,
      isExact: false
    };
  }
  
  /**
   * Runs a batch of simulations
   */
  private async runSimulationBatch(
    count: number, 
    playerResults: PlayerEquity[]
  ): Promise<void> {
    const gameVariant = this.evaluator.getVariant();
    const gameConfig = GAME_CONFIGS[gameVariant];
    
    // Run the specified number of simulations
    for (let i = 0; i < count; i++) {
      // Make copies of the original hands and board
      const originalHands = this.hands.map(hand => ({ ...hand, cards: [...hand.cards] }));
      const originalBoard = { ...this.board, cards: [...this.board.cards] };
      
      // Create a deck without the used cards
      const deck = this.createDeckWithoutUsedCards();
      deck.shuffle();
      
      // Complete each hand with random cards
      for (let j = 0; j < this.hands.length; j++) {
        const hand = this.hands[j];
        const cardsNeeded = cardsNeededForHand(hand, gameVariant);
        
        if (cardsNeeded > 0) {
          // Deal random cards to complete the hand
          const newCards = deck.deal(cardsNeeded);
          hand.cards = [...originalHands[j].cards, ...newCards];
        }
      }
      
      // Complete the board with random cards
      const boardCardsNeeded = cardsNeededForBoard(this.board, gameVariant);
      if (boardCardsNeeded > 0) {
        // Deal random cards to complete the board
        const newBoardCards = deck.deal(boardCardsNeeded);
        this.board.cards = [...originalBoard.cards, ...newBoardCards];
      }
      
      // Evaluate and update equity
      this.evaluateAndUpdateEquity(playerResults);
      
      // Restore original hands and board for the next simulation
      this.hands = originalHands;
      this.board = originalBoard;
    }
  }
  
  /**
   * Evaluates the current state and updates equity tallies
   */
  private evaluateAndUpdateEquity(playerResults: PlayerEquity[]): void {
    // Evaluate each player's hand
    const evaluatedHands: EvaluatedHand[] = this.hands.map(hand => 
      this.evaluator.evaluate(hand.cards, this.board.cards)
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
      playerResults[winners[0]].wins++;
      
      // Update winning hand rank count
      const winningRank = evaluatedHands[winners[0]].rank;
      if (!playerResults[winners[0]].winningHandRankCounts[winningRank]) {
        playerResults[winners[0]].winningHandRankCounts[winningRank] = 0;
      }
      playerResults[winners[0]].winningHandRankCounts[winningRank]++;
    } else {
      // Multiple winners (tie)
      for (const winner of winners) {
        playerResults[winner].ties++;
        
        // Update winning hand rank count for ties
        const tiedRank = evaluatedHands[winner].rank;
        if (!playerResults[winner].winningHandRankCounts[tiedRank]) {
          playerResults[winner].winningHandRankCounts[tiedRank] = 0;
        }
        playerResults[winner].winningHandRankCounts[tiedRank] += 1/winners.length;
      }
    }
  }
}