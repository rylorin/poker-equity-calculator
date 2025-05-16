# Poker Equity Calculator

A comprehensive TypeScript library for calculating poker hand equity across different game variants.

## Features

- Support for multiple poker variants (Texas Hold'em, Omaha)
- Monte Carlo simulation for quick equity estimation
- Exhaustive calculation for precise equity results
- Support for unlimited players
- Handle incomplete hands and boards
- Dead card tracking
- Detailed equity results including win/tie percentages

## Installation

```bash
npm install poker-equity-calculator
```

## Usage

### Basic Example

```typescript
import { PokerEquityCalculator, GameVariant } from 'poker-equity-calculator';

// Create a calculator for Texas Hold'em
const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);

// Add player hands
calculator.addHand('AsKs');    // Player 1: A♠K♠
calculator.addHand('QhJh');    // Player 2: Q♥J♥

// Set the board
calculator.setBoard('Ts9s2h'); // Board: T♠9♠2♥

// Calculate equity
const result = await calculator.calculateEquity();

// Display results
result.playerResults.forEach((player, index) => {
  console.log(`Player ${index + 1} equity: ${(player.equity * 100).toFixed(2)}%`);
});
```

### Omaha Example

```typescript
import { PokerEquityCalculator, GameVariant } from 'poker-equity-calculator';

// Create a calculator for Omaha
const calculator = new PokerEquityCalculator(GameVariant.OMAHA);

// Add player hands (Omaha requires 4 hole cards)
calculator.addHand('AsKsQsJs');  // Player 1
calculator.addHand('AhKhQhJh');  // Player 2

// Set the board
calculator.setBoard('Ts9s2h');   // Flop: T♠9♠2♥

// Add dead cards (cards that are known to be unavailable)
calculator.addDeadCards('8s7s');

// Calculate equity with additional options
const result = await calculator.calculateEquity({
  iterations: 10000,           // Number of Monte Carlo simulations
  forceExhaustive: false,      // Force exact calculation instead of Monte Carlo
  maxExhaustiveCombinations: 25000, // Max combinations for exhaustive calculation
  progressCallback: (percent) => console.log(`Progress: ${percent * 100}%`)
});

// Display results
console.log(`Calculation time: ${result.elapsedTime}ms`);
console.log(`Total hands: ${result.totalHands}`);
console.log(`Exact calculation: ${result.isExact}`);

result.playerResults.forEach((player, index) => {
  console.log(`Player ${index + 1}:`);
  console.log(`  Equity: ${(player.equity * 100).toFixed(2)}%`);
  console.log(`  Wins: ${player.wins}`);
  console.log(`  Ties: ${player.ties}`);
});
```

## API

### PokerEquityCalculator

The main class for calculating poker hand equity.

#### Constructor

```typescript
new PokerEquityCalculator(gameVariant?: GameVariant)
```

#### Methods

- `setGameVariant(variant: GameVariant): this` - Sets the poker game variant
- `addHand(handStr: string): this` - Adds a player's hand
- `setBoard(boardStr: string): this` - Sets the community board
- `addDeadCards(cardsStr: string): this` - Adds cards that are unavailable
- `clearHands(): this` - Removes all hands
- `clearBoard(): this` - Clears the board
- `clearDeadCards(): this` - Clears dead cards
- `reset(): this` - Resets everything (hands, board, dead cards)
- `calculateEquity(options?: CalculationOptions): Promise<EquityResult>` - Calculates equity
- `evaluateHand(handStr: string): EvaluatedHand` - Evaluates a single hand

### CalculationOptions

Options for equity calculation:

```typescript
interface CalculationOptions {
  iterations?: number;               // Max iterations for Monte Carlo
  forceExhaustive?: boolean;         // Force exhaustive calculation
  maxExhaustiveCombinations?: number;// Threshold for switching to Monte Carlo
  accuracyThreshold?: number;        // Accuracy threshold to stop early
  progressCallback?: (percent: number) => void; // Progress reporting
}
```

### EquityResult

Result of equity calculation:

```typescript
interface EquityResult {
  playerResults: PlayerEquity[];     // Results for each player
  totalHands: number;                // Total hands evaluated
  elapsedTime: number;               // Calculation time in ms
  isExact: boolean;                  // Whether result is exact
}

interface PlayerEquity {
  handIndex: number;                 // Index of player's hand
  equity: number;                    // Equity as fraction (0.0-1.0)
  wins: number;                      // Number of wins
  ties: number;                      // Number of ties
  handRankCounts: Record<HandRank, number>; // Distribution of hand ranks
  winningHandRankCounts: Record<HandRank, number>; // Winning hand distribution
}
```

### Game Variants

Supported poker variants:

```typescript
enum GameVariant {
  TEXAS_HOLDEM = 'texas_holdem',
  OMAHA = 'omaha',
  OMAHA_HI_LO = 'omaha_hi_lo',
  SEVEN_CARD_STUD = 'seven_card_stud',
  FIVE_CARD_DRAW = 'five_card_draw'
}
```

## Card Notation

Cards are represented as strings with two characters:

- First character: Rank (2-9, T, J, Q, K, A)
- Second character: Suit (s, h, d, c)

Examples:
- `'As'` - Ace of spades
- `'Th'` - Ten of hearts
- `'2c'` - Two of clubs

Hand strings have no separators:
- `'AsKs'` - Ace and King of spades
- `'QhJhTh9h'` - Queen, Jack, Ten, and Nine of hearts

## License

MIT