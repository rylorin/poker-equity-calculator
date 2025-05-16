import { PokerEquityCalculator, GameVariant } from '../src';

describe('Texas Hold\'em Equity Calculation', () => {
  let calculator: PokerEquityCalculator;

  beforeEach(() => {
    calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
  });

  test('AK vs QJ, Board T92 - exact calculation', async () => {
    calculator.addHand('AsKs');
    calculator.addHand('QhJh');
    calculator.setBoard('Ts9s2h');
    
    const result = await calculator.calculateEquity({ forceExhaustive: true });
    
    expect(result.isExact).toBe(true);
    expect(result.playerResults.length).toBe(2);
    
    // AK should have better equity against QJ with this board
    expect(result.playerResults[0].equity).toBeGreaterThan(0.5);
    expect(result.playerResults[1].equity).toBeLessThan(0.5);
    
    // Sum of equities should be approximately 1
    const totalEquity = result.playerResults[0].equity + result.playerResults[1].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });
  
  test('Pair vs Pair - Monte Carlo calculation', async () => {
    calculator.addHand('AsAh');
    calculator.addHand('KsKh');
    calculator.setBoard('Ts9s2h');
    
    const result = await calculator.calculateEquity({ 
      iterations: 1000, 
      forceExhaustive: false 
    });
    
    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);
    
    // AA should have better equity against KK
    expect(result.playerResults[0].equity).toBeGreaterThan(0.75);
    expect(result.playerResults[1].equity).toBeLessThan(0.25);
    
    // Sum of equities should be approximately 1
    const totalEquity = result.playerResults[0].equity + result.playerResults[1].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });
  
  test('Three-way equity calculation', async () => {
    calculator.addHand('AsKs');
    calculator.addHand('QhJh');
    calculator.addHand('TsTs');
    calculator.setBoard('8s7s6h');
    
    const result = await calculator.calculateEquity({ 
      iterations: 1000
    });
    
    expect(result.playerResults.length).toBe(3);
    
    // Sum of equities should be approximately 1
    const totalEquity = 
      result.playerResults[0].equity + 
      result.playerResults[1].equity + 
      result.playerResults[2].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });
  
  test('Hand with clear winner on river', async () => {
    calculator.addHand('AsKs');
    calculator.addHand('QhJh');
    calculator.setBoard('Ts9s2h8c7s'); // River gives As-Ks-Ts-9s-7s = flush
    
    const result = await calculator.calculateEquity();
    
    expect(result.playerResults.length).toBe(2);
    
    // Player 1 has a flush, should win 100%
    expect(result.playerResults[0].equity).toBe(1);
    expect(result.playerResults[1].equity).toBe(0);
  });
  
  test('Hand with a tie', async () => {
    calculator.addHand('AsKs');
    calculator.addHand('AhKh');
    calculator.setBoard('2s3s4h5c7d'); // Board plays, both players have A-K-7-5-4
    
    const result = await calculator.calculateEquity();
    
    expect(result.playerResults.length).toBe(2);
    
    // Both players should have equal equity
    expect(result.playerResults[0].equity).toBe(0.5);
    expect(result.playerResults[1].equity).toBe(0.5);
    
    // Check that ties are correctly counted
    expect(result.playerResults[0].ties).toBe(1);
    expect(result.playerResults[1].ties).toBe(1);
    expect(result.playerResults[0].wins).toBe(0);
    expect(result.playerResults[1].wins).toBe(0);
  });
});