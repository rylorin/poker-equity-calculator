const { PokerEquityCalculator, GameVariant } = require('../dist');

// Create a calculator for Omaha
const calculator = new PokerEquityCalculator(GameVariant.OMAHA);

// Add player hands (Omaha requires 4 hole cards)
calculator.addHand('AsKsQsJs');  // Player 1: A♠K♠Q♠J♠
calculator.addHand('AhKhQhJh');  // Player 2: A♥K♥Q♥J♥
calculator.addHand('AdKdQdJd');  // Player 3: A♦K♦Q♦J♦

// Set the flop
calculator.setBoard('Ts9s2h');   // Flop: T♠9♠2♥

// Add some dead cards
calculator.addDeadCards('8s7s');

// Calculate equity with a progress callback
const progressCallback = (percent) => {
  process.stdout.write(`Progress: ${(percent * 100).toFixed(1)}%\r`);
};

calculator.calculateEquity({ 
  iterations: 5000,
  progressCallback
})
  .then(result => {
    console.log('\nCalculation completed in', result.elapsedTime, 'ms');
    console.log('Total hands evaluated:', result.totalHands);
    console.log('Is exact calculation:', result.isExact);
    console.log('\nResults:');
    
    const handStrings = ['AsKsQsJs', 'AhKhQhJh', 'AdKdQdJd'];
    
    result.playerResults.forEach((player, index) => {
      console.log(`Player ${index + 1} (${handStrings[index]}):`);
      console.log(`  Equity: ${(player.equity * 100).toFixed(2)}%`);
      console.log(`  Wins: ${player.wins} (${(player.wins / result.totalHands * 100).toFixed(2)}%)`);
      console.log(`  Ties: ${player.ties} (${(player.ties / result.totalHands * 100).toFixed(2)}%)`);
      console.log('');
    });
  })
  .catch(err => {
    console.error('Error:', err.message);
  });