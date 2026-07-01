export function calcDeal(inputs) {
  const {
    strategy = "bridge",
    bid, gdv, auctionFees, refurb, contingency,
    // Bridge
    bridgeLTV, bridgeRate, arrangeFee, bridgeTerm, bridgeLegal,
    // Mortgage (direct)
    mortLTV, mortRate, mortFees,
    // Refi (used by bridge + cash)
    refiLTV, refiRate, refiFees,
    // Common
    sdlt, legalFees,
    rent, runCosts,
    targetMargin,
  } = inputs;

  const sdltAmt     = bid * (sdlt / 100);
  const refurbTotal = refurb * (1 + contingency / 100);
  const grossRent   = rent * 12;

  let finCost        = 0; // total financing cost
  let cashDay1       = 0;
  let cashLeftIn     = 0;
  let mortgage       = 0;
  let annualMortInt  = 0;
  let monthlyMort    = 0;
  let totalCost      = 0;
  let maxBidFixed    = 0;
  let maxBidCoeff    = 1;

  // ── BRIDGE → REFURB → REFI ──────────────────────────────
  if (strategy === "bridge") {
    const bridgeLoan   = bid * (bridgeLTV / 100);
    const arrange      = bridgeLoan * (arrangeFee / 100);
    const bridgeInt    = (bridgeLoan + arrange) * (bridgeRate / 100) * bridgeTerm;
    finCost            = arrange + bridgeInt + bridgeLegal + refiFees;
    totalCost          = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1           = (bid - bridgeLoan) + auctionFees + sdltAmt + legalFees;
    mortgage           = gdv * (refiLTV / 100);
    annualMortInt      = mortgage * (refiRate / 100);
    monthlyMort        = annualMortInt / 12;
    const bridgeRedemption  = bridgeLoan + arrange + bridgeInt;
    const totalCashDeployed = cashDay1 + refurbTotal + refiFees;
    const refiRelease  = Math.max(0, mortgage - bridgeRedemption);
    cashLeftIn         = totalCashDeployed - refiRelease;
    // max bid
    maxBidCoeff = 1 + (sdlt/100) + (bridgeLTV/100)*(arrangeFee/100)
      + (bridgeLTV/100)*(1+arrangeFee/100)*(bridgeRate/100)*bridgeTerm;
    maxBidFixed = auctionFees + legalFees + refurbTotal + bridgeLegal + refiFees;

  // ── CASH → REFURB → REFI ────────────────────────────────
  } else if (strategy === "cash") {
    finCost            = refiFees;
    totalCost          = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1           = bid + auctionFees + sdltAmt + legalFees;
    mortgage           = gdv * (refiLTV / 100);
    annualMortInt      = mortgage * (refiRate / 100);
    monthlyMort        = annualMortInt / 12;
    const totalCashDeployed = cashDay1 + refurbTotal + refiFees;
    cashLeftIn         = totalCashDeployed - mortgage;
    // max bid
    maxBidCoeff = 1 + (sdlt/100);
    maxBidFixed = auctionFees + legalFees + refurbTotal + refiFees;

  // ── DIRECT BTL MORTGAGE ──────────────────────────────────
  } else if (strategy === "mortgage") {
    const mortLoan     = bid * (mortLTV / 100);
    const mortArrange  = mortFees;
    finCost            = mortArrange;
    totalCost          = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1           = (bid - mortLoan) + auctionFees + sdltAmt + legalFees;
    mortgage           = mortLoan; // no refi — mortgage stays on purchase price
    annualMortInt      = mortgage * (mortRate / 100);
    monthlyMort        = annualMortInt / 12;
    const totalCashDeployed = cashDay1 + refurbTotal;
    cashLeftIn         = totalCashDeployed; // no refi release
    // max bid
    maxBidCoeff = 1 + (sdlt/100) + (1 - mortLTV/100);
    maxBidFixed = auctionFees + legalFees + refurbTotal + mortFees;
  }

  const netAnnual     = grossRent - annualMortInt - runCosts;
  const equityCreated = gdv - totalCost;
  const marginPct     = gdv > 0 ? (equityCreated / gdv) * 100 : 0;
  const grossYield    = gdv > 0 ? (grossRent / gdv) * 100 : 0;
  const netYield      = gdv > 0 ? (netAnnual  / gdv) * 100 : 0;
  const cocReturn     = cashLeftIn > 0 ? (netAnnual / cashLeftIn) * 100 : 0;
  const maxBid        = gdv > 0 ? (gdv * (1 - targetMargin/100) - maxBidFixed) / maxBidCoeff : 0;

  let verdict;
  if (marginPct >= targetMargin)          verdict = "DEAL";
  else if (marginPct >= targetMargin - 5) verdict = "MARGINAL";
  else                                    verdict = "NO DEAL";

  return {
    sdltAmt, refurbTotal, finCost, totalCost,
    cashDay1, mortgage, annualMortInt, monthlyMort, cashLeftIn,
    grossRent, netAnnual, equityCreated, marginPct,
    grossYield, netYield, cocReturn, maxBid, verdict,
    // bridge extras for waterfall
    bridgeLoan:  strategy === "bridge" ? bid*(bridgeLTV/100) : 0,
    arrange:     strategy === "bridge" ? bid*(bridgeLTV/100)*(arrangeFee/100) : 0,
    bridgeInt:   strategy === "bridge"
      ? (bid*(bridgeLTV/100))*(1+(arrangeFee/100))*(bridgeRate/100)*bridgeTerm : 0,
  };
}

export const DEFAULT_INPUTS = {
  strategy:     "bridge",
  address:      "",
  bid:          55000,
  gdv:          130000,
  auctionFees:  2500,
  refurb:       30000,
  contingency:  15,
  // bridge
  bridgeLTV:    70,
  bridgeRate:   0.85,
  arrangeFee:   2,
  bridgeTerm:   9,
  bridgeLegal:  2500,
  // direct mortgage
  mortLTV:      75,
  mortRate:     5.5,
  mortFees:     2000,
  // refi (bridge + cash exit)
  refiLTV:      75,
  refiRate:     5.5,
  refiFees:     5000,
  // common
  sdlt:         5,
  legalFees:    1500,
  rent:         750,
  runCosts:     2500,
  targetMargin: 20,
};
