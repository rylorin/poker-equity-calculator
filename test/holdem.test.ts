import { GameVariant, PokerEquityCalculator } from "../src";

describe("Texas Hold'em Equity Calculation", () => {
  // jest.setTimeout(5 * 1_000);

  let calculator: PokerEquityCalculator;

  beforeEach(() => {
    calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
  });

  test("AK vs QJ, Board T92 - exact calculation", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("QhJh");
    calculator.setBoard("Ts9s2h");

    const result = await calculator.calculateEquity({ forceExhaustive: true });
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    // AK should have better equity against QJ with this board
    expect(result.playerResults[0].equity).toBeGreaterThan(0.5);
    expect(result.playerResults[1].equity).toBeLessThan(0.5);

    // Sum of equities should be approximately 1
    const totalEquity = result.playerResults[0].equity + result.playerResults[1].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });

  test("Pair vs Pair - Monte Carlo calculation", async () => {
    calculator.addHand("AsAh");
    calculator.addHand("KsKh");
    calculator.setBoard("Ts9s2h");

    const result = await calculator.calculateEquity({
      forceExhaustive: false,
    });
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    // AA should have better equity against KK
    expect(result.playerResults[0].equity).toBeGreaterThan(0.75);
    expect(result.playerResults[1].equity).toBeLessThan(0.25);

    // Sum of equities should be approximately 1
    const totalEquity = result.playerResults[0].equity + result.playerResults[1].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });

  test("Three-way equity calculation", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("QhJh");
    calculator.addHand("TsTh");
    calculator.setBoard("8s7s6h");

    const result = await calculator.calculateEquity({});
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(3);

    // Sum of equities should be approximately 1
    const totalEquity =
      result.playerResults[0].equity + result.playerResults[1].equity + result.playerResults[2].equity;
    expect(totalEquity).toBeCloseTo(1, 5);
  });

  test("Hand with clear winner on river", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("QhJh");
    calculator.setBoard("Ts9s2h8c7s"); // River gives As-Ks-Ts-9s-7s = flush

    const result = await calculator.calculateEquity();
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    // Player 1 has a flush, should win 100%
    expect(result.playerResults[0].equity).toBe(1);
    expect(result.playerResults[1].equity).toBe(0);
  });

  test("Hand with a tie", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("AhKh");
    calculator.setBoard("2s3s4h5c7d"); // Board plays, both players have A-K-7-5-4

    const result = await calculator.calculateEquity();
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    // Both players should have equal equity
    expect(result.playerResults[0].equity).toBe(0.5);
    expect(result.playerResults[1].equity).toBe(0.5);

    // Check that ties are correctly counted
    expect(result.playerResults[0].tie).toBe(1);
    expect(result.playerResults[1].tie).toBe(1);
    expect(result.playerResults[0].win).toBe(0);
    expect(result.playerResults[1].win).toBe(0);
  });

  test("Incomplete Flop", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("AhKh");
    calculator.setBoard("2s3s");

    const result = await calculator.calculateEquity();
    console.log("result:", result);

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    expect(result.playerResults[0].equity).toBeCloseTo(0.7386, 2);
    expect(result.playerResults[0].win).toBeCloseTo(0.4881, 1);
    expect(result.playerResults[0].tie).toBeCloseTo(0.5011);

    expect(result.playerResults[1].equity).toBeCloseTo(0.2614);
    expect(result.playerResults[1].win).toBeCloseTo(0.0109, 1);
    expect(result.playerResults[1].tie).toBe(result.playerResults[0].tie);
  });

  test("Incomplete Hand", async () => {
    calculator.addHand("AsKs");
    calculator.addHand("Ah");
    calculator.setBoard("2s3s4h5c7d");

    const result = await calculator.calculateEquity({});

    expect(result.isExact).toBe(false);
    expect(result.playerResults.length).toBe(2);

    expect(result.playerResults[0].equity).toBeCloseTo(0.4545);
    expect(result.playerResults[0].win).toBeCloseTo(0);
    expect(result.playerResults[0].tie).toBeCloseTo(0.9091);

    expect(result.playerResults[1].equity).toBeCloseTo(0.5455);
    expect(result.playerResults[1].win).toBeCloseTo(0.0909);
    expect(result.playerResults[1].tie).toBe(result.playerResults[0].tie);
  });
});
