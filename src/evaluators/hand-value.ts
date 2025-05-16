import { Card, Rank, RANK_VALUES } from '../types/card';
import { HandRank, HAND_RANK_NAMES } from '../types/hand';

/**
 * Utility functions for evaluating hand values
 */

/**
 * Sorts cards by rank in descending order
 */
export function sortCardsByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
}

/**
 * Counts occurrences of each rank in a set of cards
 */
export function countRanks(cards: Card[]): Map<Rank, number> {
  const rankCounts = new Map<Rank, number>();
  
  for (const card of cards) {
    const count = rankCounts.get(card.rank) || 0;
    rankCounts.set(card.rank, count + 1);
  }
  
  return rankCounts;
}

/**
 * Counts occurrences of each suit in a set of cards
 */
export function countSuits(cards: Card[]): Map<string, Card[]> {
  const suitGroups = new Map<string, Card[]>();
  
  for (const card of cards) {
    const suitCards = suitGroups.get(card.suit) || [];
    suitCards.push(card);
    suitGroups.set(card.suit, suitCards);
  }
  
  return suitGroups;
}

/**
 * Checks if the cards contain a straight (five cards of sequential rank)
 */
export function findStraight(cards: Card[]): Card[] | null {
  if (cards.length < 5) return null;
  
  // Sort by rank (descending)
  const sortedCards = sortCardsByRank(cards);
  
  // Create a set of unique ranks (removing duplicates)
  const uniqueRanks: Rank[] = [];
  const seenRanks = new Set<Rank>();
  
  for (const card of sortedCards) {
    if (!seenRanks.has(card.rank)) {
      uniqueRanks.push(card.rank);
      seenRanks.add(card.rank);
    }
  }
  
  // Check for A-5-4-3-2 straight
  if (
    seenRanks.has(Rank.ACE) &&
    seenRanks.has(Rank.FIVE) &&
    seenRanks.has(Rank.FOUR) &&
    seenRanks.has(Rank.THREE) &&
    seenRanks.has(Rank.TWO)
  ) {
    // Find the actual cards for the straight
    const straightCards: Card[] = [];
    for (const rank of [Rank.ACE, Rank.FIVE, Rank.FOUR, Rank.THREE, Rank.TWO]) {
      const card = sortedCards.find(c => c.rank === rank);
      if (card) straightCards.push(card);
    }
    return straightCards;
  }
  
  // Check for normal straights
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const startRankValue = RANK_VALUES[uniqueRanks[i]];
    const straightCards: Card[] = [];
    
    let isStraight = true;
    for (let j = 0; j < 5; j++) {
      const expectedRankValue = startRankValue - j;
      const rank = Object.entries(RANK_VALUES).find(
        ([, value]) => value === expectedRankValue
      )?.[0] as Rank | undefined;
      
      if (!rank || !seenRanks.has(rank)) {
        isStraight = false;
        break;
      }
      
      const card = sortedCards.find(c => c.rank === rank);
      if (card) straightCards.push(card);
    }
    
    if (isStraight && straightCards.length === 5) {
      return straightCards;
    }
  }
  
  return null;
}

/**
 * Checks if the cards contain a flush (five cards of the same suit)
 */
export function findFlush(cards: Card[]): Card[] | null {
  if (cards.length < 5) return null;
  
  const suitGroups = countSuits(cards);
  
  for (const [, suitCards] of suitGroups) {
    if (suitCards.length >= 5) {
      // Return the 5 highest cards of the flush
      return sortCardsByRank(suitCards).slice(0, 5);
    }
  }
  
  return null;
}

/**
 * Gets the value of a hand for comparison purposes
 * Returns a number where higher values indicate stronger hands
 */
export function calculateHandValue(handRank: HandRank, cards: Card[]): number {
  // The base value is the hand rank multiplied by a large number
  // to ensure that a higher rank always beats any combination of lower ranks
  const baseValue = handRank * 10000000;
  
  // Sort the cards by rank for value calculation
  const sortedCards = sortCardsByRank(cards);
  
  // The remaining value is based on the ranks of the cards
  // We use a positional system where each position has a different weight
  let remainingValue = 0;
  for (let i = 0; i < sortedCards.length; i++) {
    const cardValue = RANK_VALUES[sortedCards[i].rank];
    // Higher cards contribute more to the value
    remainingValue += cardValue * Math.pow(100, 4 - i);
  }
  
  return baseValue + remainingValue;
}

/**
 * Generates a human-readable description of a hand
 */
export function generateHandDescription(handRank: HandRank, cards: Card[]): string {
  const rankCounts = countRanks(cards);
  const sortedCards = sortCardsByRank(cards);
  
  // Find rank names for important cards
  const rankNames: Record<Rank, string> = {
    [Rank.TWO]: "Twos",
    [Rank.THREE]: "Threes",
    [Rank.FOUR]: "Fours",
    [Rank.FIVE]: "Fives",
    [Rank.SIX]: "Sixes",
    [Rank.SEVEN]: "Sevens",
    [Rank.EIGHT]: "Eights",
    [Rank.NINE]: "Nines",
    [Rank.TEN]: "Tens",
    [Rank.JACK]: "Jacks",
    [Rank.QUEEN]: "Queens",
    [Rank.KING]: "Kings",
    [Rank.ACE]: "Aces"
  };
  
  // Single rank names
  const singleRankNames: Record<Rank, string> = {
    [Rank.TWO]: "Two",
    [Rank.THREE]: "Three",
    [Rank.FOUR]: "Four",
    [Rank.FIVE]: "Five",
    [Rank.SIX]: "Six",
    [Rank.SEVEN]: "Seven",
    [Rank.EIGHT]: "Eight",
    [Rank.NINE]: "Nine",
    [Rank.TEN]: "Ten",
    [Rank.JACK]: "Jack",
    [Rank.QUEEN]: "Queen",
    [Rank.KING]: "King",
    [Rank.ACE]: "Ace"
  };
  
  switch (handRank) {
    case HandRank.ROYAL_FLUSH:
      return "Royal Flush";
      
    case HandRank.STRAIGHT_FLUSH: {
      const highCard = sortedCards[0];
      return `Straight Flush, ${singleRankNames[highCard.rank]} high`;
    }
      
    case HandRank.FOUR_OF_A_KIND: {
      let quadRank: Rank | null = null;
      let kicker: Rank | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 4) quadRank = rank;
        else if (count === 1) kicker = rank;
      }
      
      if (quadRank && kicker) {
        return `Four of a Kind, ${rankNames[quadRank]} with ${singleRankNames[kicker]} kicker`;
      }
      return "Four of a Kind";
    }
      
    case HandRank.FULL_HOUSE: {
      let tripRank: Rank | null = null;
      let pairRank: Rank | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 3) tripRank = rank;
        else if (count === 2) pairRank = rank;
      }
      
      if (tripRank && pairRank) {
        return `Full House, ${rankNames[tripRank]} full of ${rankNames[pairRank]}`;
      }
      return "Full House";
    }
      
    case HandRank.FLUSH: {
      const highCard = sortedCards[0];
      return `Flush, ${singleRankNames[highCard.rank]} high`;
    }
      
    case HandRank.STRAIGHT: {
      const highCard = sortedCards[0];
      return `Straight, ${singleRankNames[highCard.rank]} high`;
    }
      
    case HandRank.THREE_OF_A_KIND: {
      let tripRank: Rank | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 3) tripRank = rank;
      }
      
      if (tripRank) {
        return `Three of a Kind, ${rankNames[tripRank]}`;
      }
      return "Three of a Kind";
    }
      
    case HandRank.TWO_PAIR: {
      const pairs: Rank[] = [];
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 2) pairs.push(rank);
      }
      
      if (pairs.length >= 2) {
        // Sort pairs by rank
        pairs.sort((a, b) => RANK_VALUES[b] - RANK_VALUES[a]);
        
        return `Two Pair, ${rankNames[pairs[0]]} and ${rankNames[pairs[1]]}`;
      }
      return "Two Pair";
    }
      
    case HandRank.PAIR: {
      let pairRank: Rank | null = null;
      
      for (const [rank, count] of rankCounts.entries()) {
        if (count === 2) pairRank = rank;
      }
      
      if (pairRank) {
        return `Pair of ${rankNames[pairRank]}`;
      }
      return "Pair";
    }
      
    case HandRank.HIGH_CARD: {
      const highCard = sortedCards[0];
      return `High Card, ${singleRankNames[highCard.rank]}`;
    }
      
    default:
      return HAND_RANK_NAMES[handRank];
  }
}