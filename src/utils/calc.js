export function calcDeal(inputs) {
  const {
    bid, gdv, auctionFees, refurb, contingency,
    bridgeLTV, bridgeRate, arrangeFee, bridgeTerm, bridgeLegal,
    sdlt, legalFees,
    refiLTV, refiRate, refiFees,
    rent, runCosts,
    targetMargin,
  } = inputs;

  const sdltAmt       = bid * (sdlt / 100);
  const refurbTotal   = refurb * (1 + contingency / 100);
  const bridgeLoan    = bid * (bridgeLTV / 100);
  const arrange       = bridgeLoan * (arrangeFee / 100);
  const bridgeInt     = (bridgeLoan + arrange) * (bridgeRate / 100) * bridgeTerm;
  const totalCost     = bid + auctionFees + sdltAmt + legalFees + refurbTotal
                        + arrange + bridgeInt + bridgeLegal + refiFees;

  const cashDay1      = (bid - bridgeLoan) + auctionFees + sdltAmt + legalFees;
  const mortgage      = gdv * (refiLTV / 100);
  const annualMortInt = mortgage * (refiRate / 100);
  const monthlyMort   = annualMortInt / 12;
  const bridgeRedemption = bridgeLoan + arrange + bridgeInt;
  const totalCashDeployed = cashDay1 + refurbTotal + refiFees;
  const refiRelease   = Math.max(0, mortgage - bridgeRedemption);
  const cashLeftIn    = totalCashDeployed - refiRelease;

  const grossRent     = rent * 12;
  const netAnnual     = grossRent - annualMortInt - runCosts;
  const equityCreated = gdv - totalCost;
  const marginPct     = gdv > 0 ? (equityCreated / gdv) * 100 : 0;
  const grossYield    = gdv > 0 ? (grossRent / gdv) * 100 : 0;
  const netYield      = gdv > 0 ? (netAnnual  / gdv) * 100 : 0;
  const cocReturn     = cashLeftIn > 0 ? (netAnnual / cashLeftIn) * 100 : 0;

  // Max bid algebra
  const bCoeff = 1 + (sdlt / 100)
    + (bridgeLTV / 100) * (arrangeFee / 100)
    + (bridgeLTV / 100) * (1 + arrangeFee / 100) * (bridgeRate / 100) * bridgeTerm;
  const bFixed = auctionFees + legalFees + refurbTotal + bridgeLegal + refiFees;
  const maxBid = gdv > 0 ? (gdv * (1 - targetMargin / 100) - bFixed) / bCoeff : 0;

  let verdict;
  if (marginPct >= targetMargin)           verdict = "DEAL";
  else if (marginPct >= targetMargin - 5)  verdict = "MARGINAL";
  else                                     verdict = "NO DEAL";

  return {
    sdltAmt, refurbTotal, bridgeLoan, arrange, bridgeInt, totalCost,
    cashDay1, mortgage, annualMortInt, monthlyMort,
    bridgeRedemption, totalCashDeployed, refiRelease, cashLeftIn,
    grossRent, netAnnual, equityCreated, marginPct,
    grossYield, netYield, cocReturn, maxBid, verdict,
  };
}

export const DEFAULT_INPUTS = {
  address:      "",
  bid:          55000,
  gdv:          130000,
  auctionFees:  2500,
  refurb:       30000,
  contingency:  15,
  bridgeLTV:    70,
  bridgeRate:   0.85,
  arrangeFee:   2,
  bridgeTerm:   9,
  bridgeLegal:  2500,
  sdlt:         5,
  legalFees:    1500,
  refiLTV:      75,
  refiRate:     5.5,
  refiFees:     5000,
  rent:         750,
  runCosts:     2500,
  targetMargin: 20,
};
