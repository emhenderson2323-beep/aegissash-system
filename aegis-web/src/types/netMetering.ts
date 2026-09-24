/** Net metering / grid-export ROI data models */

export interface NetMeteringInputs {
  allInRetailRate: number;
  exportCompensationType: 'retail_1to1' | 'wholesale_avoided' | 'tou_split';
  wholesaleExportRate: number;
  annualRateEscalation: number;
  monthlyFixedGridFee: number;
  annualElectricalGenkWh: number;
  annualThermalGenkWh: number;
  thermalOffsetValuePerkWh: number;
  selfConsumptionRatio: number;
  systemCapEx: number;
  incentiveDeduction: number;
  annualDegradationRate: number;
  discountRate: number;
  analysisPeriodYears: number;
}

export interface YearFinancialSummary {
  year: number;
  grossGenerationkWh: number;
  selfConsumedkWh: number;
  exportedkWh: number;
  selfConsumptionSavings: number;
  gridExportCredits: number;
  thermalSavings: number;
  grossAnnualSavings: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  discountedCumulative: number;
}

export interface NetMeteringResults {
  year1Savings: number;
  year1SelfConsumptionValue: number;
  year1GridExportValue: number;
  year1ThermalOffsetValue: number;
  simplePaybackYears: number;
  discountedPaybackYears: number;
  twentyFiveYearNetSavings: number;
  npv: number;
  lcoePerkWh: number;
  twentyFiveYearRoiPercent: number;
  annualBreakdown: YearFinancialSummary[];
}

export const DEFAULT_NET_METERING_INPUTS: NetMeteringInputs = {
  allInRetailRate: 0.27,
  exportCompensationType: 'retail_1to1',
  wholesaleExportRate: 0.08,
  annualRateEscalation: 3.5,
  monthlyFixedGridFee: 27.0,
  annualElectricalGenkWh: 400,
  annualThermalGenkWh: 800,
  thermalOffsetValuePerkWh: 0.12,
  selfConsumptionRatio: 60,
  systemCapEx: 1593,
  incentiveDeduction: 478,
  annualDegradationRate: 0.5,
  discountRate: 6.0,
  analysisPeriodYears: 25,
};
