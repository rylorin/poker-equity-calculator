const { PokerEquityCalculator, GameVariant } = require('../dist');

// Function to run both calculation methods and compare results
async function compareCalculationMethods() {
  // Create a calculator for Texas Hold'em
  const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
  
  // Add player hands
  calculator.addHand('AsKs');  // Player 1: A♠K♠
  calculator.addHand('QhJh');  // Player 2: Q♥J♥
  
  // Set the turn
  calculator.setBoard('Ts9s2h8c');  // Turn: T♠9♠2♥8♣
  
  console.log('Running exhaustive calculation...');
  const exhaustiveResult = await calculator.calculateEquity({ 
    forceExhaustive: true 
  });
  
  console.log('Running Monte Carlo calculation...');
  const monteCarloResult = await calculator.calculateEquity({ 
    forceExhaustive: false,
    iterations: 10000
  });
  
  console.log('\nComparison:');
  console.log('Exhaustive calculation:');
  console.log(`  Time: ${exhaustiveResult.elapsedTime}ms`);
  console.log(`  Hands: ${exhaustiveResult.totalHands}`);
  
  console.log('Monte Carlo calculation:');
  console.log(`  Time: ${monteCarloResult.elapsedTime}ms`);
  console.log(`  Hands: ${monteCarloResult.totalHands}`);
  
  console.log('\nPlayer 1 equity:');
  console.log(`  Exhaustive: ${(exhaustiveResult.playerResults[0].equity * 100).toFixed(2)}%`);
  console.log(`  Monte Carlo: ${(monteCarloResult.playerResults[0].equity * 100).toFixed(2)}%`);
  console.log(`  Difference: ${(Math.abs(exhaustiveResult.playerResults[0].equity - monteCarloResult.playerResults[0].equity) * 100).toFixed(2)}%`);
  
  console.log('\nPlayer 2 equity:');
  console.log(`  Exhaustive: ${(exhaustiveResult.playerResults[1].equity * 100).toFixed(2)}%`);
  console.log(`  Monte Carlo: ${(monteCarloResult.playerResults[1].equity * 100).toFixed(2)}%`);
  console.log(`  Difference: ${(Math.abs(exhaustiveResult.playerResults[1].equity - monteCarloResult.playerResults[1].equity) * 100).toFixed(2)}%`);
}

compareCalculationMethods()
  .catch(err => {
    console.error('Error:', err.message);
  });