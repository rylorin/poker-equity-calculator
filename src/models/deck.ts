import { Card, Rank, Suit } from '../types/card';
import { isCardInArray } from './card';

/**
 * Represents a standard deck of playing cards
 */
export class Deck {
  private cards: Card[] = [];
  private readonly fullDeck: Card[] = [];
  
  constructor() {
    // Initialize the full 52-card deck
    const suits = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];
    const ranks = [
      Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT,
      Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
    ];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        this.fullDeck.push({ rank, suit });
      }
    }
    
    this.reset();
  }
  
  /**
   * Resets the deck to a full 52-card state
   */
  reset(): void {
    this.cards = [...this.fullDeck];
  }
  
  /**
   * Shuffles the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  /**
   * Removes specific cards from the deck (e.g., cards already dealt or dead cards)
   */
  removeCards(cardsToRemove: Card[]): void {
    this.cards = this.cards.filter(card => 
      !cardsToRemove.some(c => c.rank === card.rank && c.suit === card.suit)
    );
  }
  
  /**
   * Deals a specified number of cards from the deck
   */
  deal(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} remaining`);
    }
    
    const dealtCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      dealtCards.push(this.cards.pop()!);
    }
    
    return dealtCards;
  }
  
  /**
   * Returns a random card from the deck without removing it
   */
  peekRandomCard(): Card {
    if (this.cards.length === 0) {
      throw new Error('No cards left in the deck');
    }
    
    const randomIndex = Math.floor(Math.random() * this.cards.length);
    return this.cards[randomIndex];
  }
  
  /**
   * Gets the number of remaining cards in the deck
   */
  get remainingCards(): number {
    return this.cards.length;
  }
  
  /**
   * Gets all remaining cards in the deck
   */
  get allCards(): Card[] {
    return [...this.cards];
  }
  
  /**
   * Checks if a specific card is still in the deck
   */
  hasCard(card: Card): boolean {
    return isCardInArray(card, this.cards);
  }
}