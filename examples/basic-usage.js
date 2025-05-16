const { PokerEquityCalculator, GameVariant } = require('../dist');

// Create a calculator for Texas Hold'em
const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);

// Add player hands
calculator.addHand('AsKs');    // Player 1: A♠K♠
calculator.addHand('QhJh');    // Player 2: Q♥J♥

// Set the board
calculator.setBoard('Ts9s2h'); // Board: T♠9♠2♥

// Calculate equity
calculator.calculateEquity({ iterations: 10000 })
  .then(result => {
    console.log('Calculation completed in', result.elapsedTime, 'ms');
    console.log('Total hands evaluated:', result.totalHands);
    console.log('Is exact calculation:', result.isExact);
    console.log('\nResults:');
    
    result.playerResults.forEach((player, index) => {
      console.log(`Player ${index + 1} (${['AsKs', 'QhJh'][index]}):`);
      console.log(`  Equity: ${(player.equity * 100).toFixed(2)}%`);
      console.log(`  Wins: ${player.wins} (${(player.wins / result.totalHands * 100).toFixed(2)}%)`);
      console.log(`  Ties: ${player.ties} (${(player.ties / result.totalHands * 100).toFixed(2)}%)`);
      console.log('');
    });
  })
  .catch(err => {
    console.error('Error:', err.message);
  });