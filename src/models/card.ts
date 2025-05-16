import { Card, CardString, Rank, Suit, CardError } from '../types/card';

/**
 * Creates a Card object from a string representation (e.g., 'As', 'Th', '2c')
 */
export function createCard(cardStr: CardString): Card {
  if (!cardStr || typeof cardStr !== 'string' || cardStr.length !== 2) {
    throw new CardError(`Invalid card string: ${cardStr}`);
  }

  const rankChar = cardStr[0].toUpperCase();
  const suitChar = cardStr[1].toLowerCase();

  // Validate rank
  const rankMap: Record<string, Rank> = {
    '2': Rank.TWO,
    '3': Rank.THREE,
    '4': Rank.FOUR,
    '5': Rank.FIVE,
    '6': Rank.SIX,
    '7': Rank.SEVEN,
    '8': Rank.EIGHT,
    '9': Rank.NINE,
    'T': Rank.TEN,
    'J': Rank.JACK,
    'Q': Rank.QUEEN,
    'K': Rank.KING,
    'A': Rank.ACE
  };

  const rank = rankMap[rankChar];
  if (!rank) {
    throw new CardError(`Invalid card rank: ${rankChar}`);
  }

  // Validate suit
  const suitMap: Record<string, Suit> = {
    's': Suit.SPADES,
    'h': Suit.HEARTS,
    'd': Suit.DIAMONDS,
    'c': Suit.CLUBS
  };

  const suit = suitMap[suitChar];
  if (!suit) {
    throw new CardError(`Invalid card suit: ${suitChar}`);
  }

  return { rank, suit };
}

/**
 * Converts a Card object to its string representation
 */
export function cardToString(card: Card): CardString {
  return `${card.rank}${card.suit}`;
}

/**
 * Creates multiple Card objects from a string (e.g., 'AsKhQd')
 */
export function createCards(cardsStr: string): Card[] {
  if (!cardsStr) return [];
  
  const cards: Card[] = [];
  
  for (let i = 0; i < cardsStr.length; i += 2) {
    if (i + 1 >= cardsStr.length) {
      throw new CardError(`Invalid card string at position ${i}: incomplete card`);
    }
    
    const cardStr = cardsStr.substring(i, i + 2);
    cards.push(createCard(cardStr));
  }
  
  return cards;
}

/**
 * Converts an array of Card objects to a string representation
 */
export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join('');
}

/**
 * Compares two cards for equality
 */
export function areCardsEqual(card1: Card, card2: Card): boolean {
  return card1.rank === card2.rank && card1.suit === card2.suit;
}

/**
 * Checks if a given card is in an array of cards
 */
export function isCardInArray(card: Card, cards: Card[]): boolean {
  return cards.some(c => areCardsEqual(c, card));
}