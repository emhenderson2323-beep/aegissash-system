import {
  NetMeteringInputs,
  NetMeteringResults,
  YearFinancialSummary,
} from './types/netMetering';

export function calculateNetMeteringROI(inputs: NetMeteringInputs): NetMeteringResults {
  const {
    allInRetailRate,
    exportCompensationType,
    wholesaleExportRate,
    annualRateEscalation,
    annualElectricalGenkWh,
    annualThermalGenkWh,
    thermalOffsetValuePerkWh,
    selfConsumptionRatio,
    systemCapEx,
    incentiveDeduction,
    annualDegradationRate,
    discountRate,
    analysisPeriodYears,
  } = inputs;

  const netInitialInvestment = Math.max(0, systemCapEx - incentiveDeduction);
  const selfConsFraction = Math.min(1, Math.max(0, selfConsumptionRatio / 100));
  const exportFraction = 1 - selfConsFraction;
  const degradationFactor = 1 - annualDegradationRate / 100;
  const escalationFactor = 1 + annualRateEscalation / 100;
  const discountFactor = 1 + discountRate / 100;

  const annualBreakdown: YearFinancialSummary[] = [];
  let cumulativeCashFlow = -netInitialInvestment;
  let discountedCumulative = -netInitialInvestment;
  let simplePaybackYears = analysisPeriodYears;
  let discountedPaybackYears = analysisPeriodYears;
  let totalDiscountedCashFlows = -netInitialInvestment;
  let totalDiscountedEnergyGen = 0;
  let paybackFound = false;
  let discountedPaybackFound = false;

  for (let yr = 1; yr <= analysisPeriodYears; yr++) {
    const yrGenkWh = annualElectricalGenkWh * Math.pow(degradationFactor, yr - 1);
    const yrThermalkWh = annualThermalGenkWh * Math.pow(degradationFactor, yr - 1);
    const yrRetailRate = allInRetailRate * Math.pow(escalationFactor, yr - 1);
    const yrThermalRate = thermalOffsetValuePerkWh * Math.pow(escalationFactor, yr - 1);

    const selfConsumedkWh = yrGenkWh * selfConsFraction;
    const exportedkWh = yrGenkWh * exportFraction;

    const selfConsumptionSavings = selfConsumedkWh * yrRetailRate;

    let exportRateUsed = yrRetailRate;
    if (exportCompensationType === 'wholesale_avoided') {
      exportRateUsed = wholesaleExportRate * Math.pow(escalationFactor, yr - 1);
    } else if (exportCompensationType === 'tou_split') {
      exportRateUsed = yrRetailRate * 0.75;
    }
    const gridExportCredits = exportedkWh * exportRateUsed;
    const thermalSavings = yrThermalkWh * yrThermalRate;

    const grossAnnualSavings = selfConsumptionSavings + gridExportCredits + thermalSavings;
    const previousCumulative = cumulativeCashFlow;
    const previousDiscounted = discountedCumulative;
    cumulativeCashFlow += grossAnnualSavings;

    const yrDiscount = Math.pow(discountFactor, yr);
    const discountedAnnualSavings = grossAnnualSavings / yrDiscount;
    totalDiscountedCashFlows += discountedAnnualSavings;
    discountedCumulative += discountedAnnualSavings;
    totalDiscountedEnergyGen += (yrGenkWh + yrThermalkWh) / yrDiscount;

    if (!paybackFound && cumulativeCashFlow >= 0) {
      const fraction =
        grossAnnualSavings > 0 ? Math.abs(previousCumulative) / grossAnnualSavings : 0;
      simplePaybackYears = yr - 1 + fraction;
      paybackFound = true;
    }
    if (!discountedPaybackFound && discountedCumulative >= 0) {
      const fraction =
        discountedAnnualSavings > 0
          ? Math.abs(previousDiscounted) / discountedAnnualSavings
          : 0;
      discountedPaybackYears = yr - 1 + fraction;
      discountedPaybackFound = true;
    }

    annualBreakdown.push({
      year: yr,
      grossGenerationkWh: Math.round(yrGenkWh * 10) / 10,
      selfConsumedkWh: Math.round(selfConsumedkWh * 10) / 10,
      exportedkWh: Math.round(exportedkWh * 10) / 10,
      selfConsumptionSavings: Math.round(selfConsumptionSavings * 100) / 100,
      gridExportCredits: Math.round(gridExportCredits * 100) / 100,
      thermalSavings: Math.round(thermalSavings * 100) / 100,
      grossAnnualSavings: Math.round(grossAnnualSavings * 100) / 100,
      netCashFlow: Math.round(grossAnnualSavings * 100) / 100,
      cumulativeCashFlow: Math.round(cumulativeCashFlow * 100) / 100,
      discountedCumulative: Math.round(discountedCumulative * 100) / 100,
    });
  }

  const y1 = annualBreakdown[0];
  const twentyFiveYearNetSavings = cumulativeCashFlow;
  const lcoePerkWh =
    totalDiscountedEnergyGen > 0 ? netInitialInvestment / totalDiscountedEnergyGen : 0;
  const twentyFiveYearRoiPercent =
    netInitialInvestment > 0 ? (twentyFiveYearNetSavings / netInitialInvestment) * 100 : 0;

  return {
    year1Savings: y1 ? y1.grossAnnualSavings : 0,
    year1SelfConsumptionValue: y1 ? y1.selfConsumptionSavings : 0,
    year1GridExportValue: y1 ? y1.gridExportCredits : 0,
    year1ThermalOffsetValue: y1 ? y1.thermalSavings : 0,
    simplePaybackYears: Number(simplePaybackYears.toFixed(1)),
    discountedPaybackYears: Number(discountedPaybackYears.toFixed(1)),
    twentyFiveYearNetSavings: Number(twentyFiveYearNetSavings.toFixed(2)),
    npv: Number(totalDiscountedCashFlows.toFixed(2)),
    lcoePerkWh: Number(lcoePerkWh.toFixed(4)),
    twentyFiveYearRoiPercent: Number(twentyFiveYearRoiPercent.toFixed(1)),
    annualBreakdown,
  };
}
