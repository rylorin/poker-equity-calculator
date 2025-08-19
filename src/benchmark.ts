import { Bench } from "tinybench";
import { GameVariant, PokerEquityCalculator } from ".";

const evaluate = (holeCards: string[], communityCards: string[]) => {
  const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
  // Set the board (community cards)
  if (communityCards.length > 0) {
    const boardStr = communityCards.join("");
    if (boardStr.length > 0) {
      calculator.setBoard(boardStr);
    }
  }
  try {
    const handStr = holeCards.join("");
    const result = calculator.evaluateHand(handStr);
    return result;
  } catch (error) {
    console.error(`Error evaluating hand: ${error}`);
    return null;
  }
};

const benchmarkEvaluate = (bench: Bench) => {
  const holeCards = ["Tc", "Kc"];

  bench
    .add("evaluate high card", () => {
      evaluate(holeCards, ["Qh", "Jd", "3d", "7c", "8s"]);
    })
    .add("evaluate one pair", () => {
      evaluate(holeCards, ["Qh", "Jd", "3d", "Td", "8s"]);
    })
    .add("evaluate two pair", () => {
      evaluate(holeCards, ["Kh", "Jd", "3d", "Td", "8s"]);
    })
    .add("evaluate three of a kind", () => {
      evaluate(holeCards, ["Kh", "Jd", "3d", "Kd", "8s"]);
    })
    .add("evaluate straight", () => {
      evaluate(holeCards, ["Qh", "Jd", "3d", "Ac", "8s"]);
    })
    .add("evaluate flush", () => {
      evaluate(holeCards, ["Qc", "Jc", "3c", "Ac", "8c"]);
    })
    .add("evaluate full house", () => {
      evaluate(holeCards, ["Kh", "Jd", "3d", "Kd", "3s"]);
    })
    .add("evaluate four of a kind", () => {
      evaluate(holeCards, ["Kh", "Jd", "Kd", "Ks", "Kc"]);
    })
    .add("evaluate straight flush", () => {
      evaluate(holeCards, ["Qc", "Jc", "Tc", "Kc", "9c"]);
    })
    .add("evaluate royal flush", () => {
      evaluate(holeCards, ["Qc", "Jc", "Tc", "Kc", "Ac"]);
    });
};

const benchmarkEquity = (bench: Bench) => {
  bench
    .add("equity calculation heads up", async () => {
      const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
      calculator.addHand("AsKs");
      calculator.addHand("QhJh");
      calculator.setBoard("Ts9s2h");
      await calculator.calculateEquity({ forceExhaustive: true });
    })
    .add("equity calculation multiway", async () => {
      const calculator = new PokerEquityCalculator(GameVariant.TEXAS_HOLDEM);
      calculator.addHand("AsKs");
      calculator.addHand("QhJh");
      calculator.addHand("5s4s");
      calculator.addHand("9h9c");
      calculator.setBoard("Ts9s2h");
      await calculator.calculateEquity({ forceExhaustive: true });
    });
};

(async () => {
  const bench = new Bench();

  benchmarkEvaluate(bench);
  benchmarkEquity(bench);

  await bench.run();

  console.table(bench.table());
})();
