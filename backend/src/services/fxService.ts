interface FxQuote {
  from: string;
  to: string;
  rate: number;
  via: string[];
  fees: number;
  outputAmount: number;
}

const baseRates: Record<string, number> = {
  INR_USDC: 0.012,
  EUR_USDC: 1.09,
  GBP_USDC: 1.28,
  SGD_USDC: 0.73,
  USDC_USD: 1,
};

export function getRate(from: string, to: string): number {
  const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
  if (baseRates[key]) return baseRates[key];

  if (from === "USDC") {
    const reverse = `${to.toUpperCase()}_USDC`;
    if (baseRates[reverse]) return 1 / baseRates[reverse];
  }

  if (to === "USDC") {
    const direct = `${from.toUpperCase()}_USDC`;
    if (baseRates[direct]) return baseRates[direct];
  }

  throw new Error(`Unsupported pair ${from}->${to}`);
}

function withSpread(baseRate: number): number {
  const spread = 0.005 * (Math.random() * 2 - 1);
  return baseRate * (1 + spread);
}

export function convertAmount(amount: number, from: string, to: string): { rate: number; converted: number } {
  const rate = withSpread(getRate(from, to));
  return { rate, converted: amount * rate };
}

export function getBestRoute(from: string, to: string, amount: number): FxQuote {
  const directRate = getRate(from, to);
  const directOutput = amount * directRate;
  const directFees = directOutput * 0.002;

  let viaRate = 0;
  let viaOutput = 0;
  let viaFees = 0;
  if (from !== "USDC" && to !== "USDC") {
    const r1 = getRate(from, "USDC");
    const r2 = getRate("USDC", to);
    viaRate = r1 * r2;
    viaOutput = amount * viaRate;
    viaFees = viaOutput * 0.003;
  }

  if (viaRate > 0 && viaOutput - viaFees > directOutput - directFees) {
    return {
      from,
      to,
      rate: viaRate,
      via: ["USDC"],
      fees: viaFees,
      outputAmount: viaOutput,
    };
  }

  return {
    from,
    to,
    rate: directRate,
    via: [],
    fees: directFees,
    outputAmount: directOutput,
  };
}
