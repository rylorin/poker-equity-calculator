import { Card } from '../types/card';

/**
 * Generates all possible combinations of cards of a given size from a set of cards
 * Uses a recursive approach to generate combinations
 */
export function generateCombinations(cards: Card[], k: number): Card[][] {
  // Base cases
  if (k === 0) return [[]];
  if (k > cards.length) return [];
  
  const result: Card[][] = [];
  
  // Recursive case: either include the first card or don't
  const first = cards[0];
  const rest = cards.slice(1);
  
  // Combinations that include the first card
  const combsWithFirst = generateCombinations(rest, k - 1);
  for (const comb of combsWithFirst) {
    result.push([first, ...comb]);
  }
  
  // Combinations that don't include the first card
  const combsWithoutFirst = generateCombinations(rest, k);
  for (const comb of combsWithoutFirst) {
    result.push(comb);
  }
  
  return result;
}

/**
 * Calculates the number of possible combinations (nCr)
 * This is used to determine if exhaustive calculation is feasible
 */
export function calculateCombinations(n: number, r: number): number {
  if (r > n) return 0;
  if (r === 0 || r === n) return 1;
  
  let result = 1;
  for (let i = 1; i <= r; i++) {
    result *= (n - (r - i));
    result /= i;
  }
  
  return Math.round(result);
}

/**
 * Generates a random combination of cards of a given size from a set of cards
 * This is more efficient than generating all combinations for Monte Carlo simulation
 */
export function getRandomCombination(cards: Card[], k: number): Card[] {
  if (k > cards.length) {
    throw new Error(`Cannot select ${k} cards from a set of ${cards.length}`);
  }
  
  // Create a copy of the cards array to avoid modifying the original
  const cardsCopy = [...cards];
  const result: Card[] = [];
  
  // Randomly select k cards from the array
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * cardsCopy.length);
    result.push(cardsCopy[randomIndex]);
    cardsCopy.splice(randomIndex, 1);
  }
  
  return result;
}