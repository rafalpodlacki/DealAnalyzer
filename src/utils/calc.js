export function calcDeal(inputs) {
  const {
    strategy = "bridge",
    bid, gdv, auctionFees, refurb, contingency,
    bridgeLTV, bridgeRate, arrangeFee, bridgeTerm, bridgeLegal,
    mortLTV, mortRate, mortFees,
    refiLTV, refiRate,
    refiArrangeFee = 1500, refiValuation = 400, refiLegal = 1000, refiBroker = 500,
    sdlt, legalFees,
    rent, runCosts,
    targetMargin,
  } = inputs;

  const sdltAmt     = bid * (sdlt / 100);
  const refurbTotal = refurb * (1 + contingency / 100);
  const grossRent   = rent * 12;
  const refiFees    = (refiArrangeFee||0) + (refiValuation||0) + (refiLegal||0) + (refiBroker||0);

  let finCost=0, cashDay1=0, cashLeftIn=0, mortgage=0, annualMortInt=0, monthlyMort=0;
  let totalCost=0, maxBidFixed=0, maxBidCoeff=1;
  let arrange=0, bridgeInt=0, bridgeLoanAmt=0;

  if (strategy === "bridge") {
    bridgeLoanAmt  = bid * (bridgeLTV / 100);
    arrange        = bridgeLoanAmt * (arrangeFee / 100);
    bridgeInt      = (bridgeLoanAmt + arrange) * (bridgeRate / 100) * bridgeTerm;
    finCost        = arrange + bridgeInt + bridgeLegal + refiFees;
    totalCost      = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1       = (bid - bridgeLoanAmt) + auctionFees + sdltAmt + legalFees;
    mortgage       = gdv * (refiLTV / 100);
    annualMortInt  = mortgage * (refiRate / 100);
    monthlyMort    = annualMortInt / 12;
    const bridgeRedemption  = bridgeLoanAmt + arrange + bridgeInt;
    const totalCashDeployed = cashDay1 + refurbTotal + refiFees;
    cashLeftIn     = totalCashDeployed - Math.max(0, mortgage - bridgeRedemption);
    maxBidCoeff    = 1 + (sdlt/100) + (bridgeLTV/100)*(arrangeFee/100)
      + (bridgeLTV/100)*(1+arrangeFee/100)*(bridgeRate/100)*bridgeTerm;
    maxBidFixed    = auctionFees + legalFees + refurbTotal + bridgeLegal + refiFees;

  } else if (strategy === "cash") {
    finCost        = refiFees;
    totalCost      = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1       = bid + auctionFees + sdltAmt + legalFees;
    mortgage       = gdv * (refiLTV / 100);
    annualMortInt  = mortgage * (refiRate / 100);
    monthlyMort    = annualMortInt / 12;
    cashLeftIn     = cashDay1 + refurbTotal + refiFees - mortgage;
    maxBidCoeff    = 1 + (sdlt/100);
    maxBidFixed    = auctionFees + legalFees + refurbTotal + refiFees;

  } else if (strategy === "mortgage") {
    const mortLoan = bid * (mortLTV / 100);
    finCost        = mortFees;
    totalCost      = bid + auctionFees + sdltAmt + legalFees + refurbTotal + finCost;
    cashDay1       = (bid - mortLoan) + auctionFees + sdltAmt + legalFees;
    mortgage       = mortLoan;
    annualMortInt  = mortgage * (mortRate / 100);
    monthlyMort    = annualMortInt / 12;
    cashLeftIn     = cashDay1 + refurbTotal;
    maxBidCoeff    = 1 + (sdlt/100) + (1 - mortLTV/100);
    maxBidFixed    = auctionFees + legalFees + refurbTotal + mortFees;
  }

  const netAnnual     = grossRent - annualMortInt - runCosts;
  const equityCreated = gdv - totalCost;
  const marginPct     = gdv > 0 ? (equityCreated / gdv) * 100 : 0;
  const grossYield    = gdv > 0 ? (grossRent / gdv) * 100 : 0;
  const netYield      = gdv > 0 ? (netAnnual / gdv) * 100 : 0;
  const cocReturn     = cashLeftIn > 0 ? (netAnnual / cashLeftIn) * 100 : 0;
  const maxBid        = gdv > 0 ? (gdv*(1-targetMargin/100) - maxBidFixed) / maxBidCoeff : 0;
  const verdict       = marginPct >= targetMargin ? "DEAL" : marginPct >= targetMargin-5 ? "MARGINAL" : "NO DEAL";

  return {
    sdltAmt, refurbTotal, finCost, refiFees, totalCost,
    cashDay1, mortgage, annualMortInt, monthlyMort, cashLeftIn,
    grossRent, netAnnual, equityCreated, marginPct,
    grossYield, netYield, cocReturn, maxBid, verdict,
    bridgeLoan: bridgeLoanAmt, arrange, bridgeInt,
  };
}

export const DEFAULT_INPUTS = {
  strategy:       "bridge",
  address:        "",
  bid:            55000,
  gdv:            130000,
  auctionFees:    2500,
  refurb:         30000,
  contingency:    15,
  bridgeLTV:      70,
  bridgeRate:     0.85,
  arrangeFee:     2,
  bridgeTerm:     9,
  bridgeLegal:    2500,
  mortLTV:        75,
  mortRate:       5.5,
  mortFees:       2000,
  refiLTV:        75,
  refiRate:       5.5,
  refiArrangeFee: 1500,
  refiValuation:  400,
  refiLegal:      1000,
  refiBroker:     500,
  sdlt:           5,
  legalFees:      1500,
  rent:           750,
  runCosts:       2500,
  targetMargin:   20,
};
