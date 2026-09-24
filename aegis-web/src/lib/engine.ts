/**
 * Aegis Sash physics engine — BIPV-T + climate + CTE + hydronics
 * Docket AEGIS-PROV-2026-01
 */

export type PolymerEnum = 'Zeonex_150ppm' | 'PMMA' | 'Polycarbonate' | 'Glass';
export type LatticeEnum = 'Penrose_P3' | 'Hexagonal' | 'Square' | 'E8_Projection';
export type DyeEnum = 'Lumogen_Red_305' | 'Lumogen_Yellow_083' | 'None';
export type PvMaterialEnum = 'GaAs' | 'c-Si' | 'GaN' | 'SiC' | 'Perovskite';
export type BarrierEnum = 'Multi_ALD_AlN_SiO2' | 'Single_Layer_ALD_AlN' | 'None';
export type InverterEnum = 'Buck_Boost_DC_DC' | 'Microinverter' | 'String_Inverter';
export type CavityGasEnum = 'Air' | 'Argon' | 'Krypton';
export type SurfaceCoatingEnum = 'Fluoropolymer' | 'None' | 'AntiReflective';

export interface DesignParams {
  basePolymer: PolymerEnum;
  substrateThicknessMm: number;
  latticeGeometry: LatticeEnum;
  latticePitchNm: number;
  dyeDopant: DyeEnum;
  dyeConcentrationPpm: number;
  qdConcentrationPpm: number;
  pvMaterial: PvMaterialEnum;
  massFlowKgS: number;
  coolantCp: number;
  barrierType: BarrierEnum;
  adhesiveModulusGPa: number;
  thermalBreakWidthMm: number;
  inverterTopology: InverterEnum;
  cavityGas: CavityGasEnum;
  lowEEmissivity: number;
  surfaceCoating: SurfaceCoatingEnum;
  frettingEfficiency: number;
  edgeReflector: boolean;
  alnThicknessNm: number;
  frameDepthMm: number;
  panelWidthM: number;
  panelHeightM: number;
}

export const DEFAULT_PARAMS: DesignParams = {
  basePolymer: 'Zeonex_150ppm',
  substrateThicknessMm: 4.0,
  latticeGeometry: 'Penrose_P3',
  latticePitchNm: 420,
  dyeDopant: 'Lumogen_Red_305',
  dyeConcentrationPpm: 125,
  qdConcentrationPpm: 450,
  pvMaterial: 'GaAs',
  massFlowKgS: 0.13,
  coolantCp: 3500,
  barrierType: 'Multi_ALD_AlN_SiO2',
  adhesiveModulusGPa: 1.2,
  thermalBreakWidthMm: 18,
  inverterTopology: 'Buck_Boost_DC_DC',
  cavityGas: 'Argon',
  lowEEmissivity: 0.03,
  surfaceCoating: 'Fluoropolymer',
  frettingEfficiency: 0.96,
  edgeReflector: true,
  alnThicknessNm: 35,
  frameDepthMm: 45,
  panelWidthM: 0.914,
  panelHeightM: 1.524,
};

export const PARAM_BOUNDS = {
  substrateThicknessMm: { min: 2, max: 8 },
  latticePitchNm: { min: 200, max: 800 },
  dyeConcentrationPpm: { min: 10, max: 500 },
  qdConcentrationPpm: { min: 50, max: 800 },
  massFlowKgS: { min: 0.01, max: 0.5 },
  coolantCp: { min: 3000, max: 4200 },
  adhesiveModulusGPa: { min: 0.1, max: 3 },
  thermalBreakWidthMm: { min: 5, max: 30 },
  lowEEmissivity: { min: 0.02, max: 0.84 },
  frettingEfficiency: { min: 0.5, max: 0.99 },
  alnThicknessNm: { min: 10, max: 80 },
  frameDepthMm: { min: 20, max: 80 },
  panelWidthM: { min: 0.3, max: 2.5 },
  panelHeightM: { min: 0.3, max: 3.0 },
} as const;

export interface PhysicsMetrics {
  opticalTransparency: number;
  hazePct: number;
  pathLengthEnhancement: number;
  fretEfficiency: number;
  trapFraction: number;
  alphaSol: number;
  electricalEfficiencyPct: number;
  thermalEfficiencyPct: number;
  powerDensityWm2: number;
  combinedYieldWm2: number;
  uFactor: number;
  shgc: number;
  cellTempC: number;
  fluidDeltaT: number;
  neutralAxisMm: number;
  maxFlexuralStressMPa: number;
  wvtr: number;
  nocturnalLunarWm2: number;
  nocturnalTEGWm2: number;
  nocturnalDeltaT: number;
  nfrc100Pass: boolean;
  nfrc200Pass: boolean;
  dp105Capable: boolean;
  nec690Pass: boolean;
  ul61730Pass: boolean;
  ieee1547Pass: boolean;
  pumpPowerW: number;
  netPowerDensityWm2: number;
  fluidViscosityPaS: number;
  frictionFactor: number;
  tauMaxKPa: number;
  tauYieldKPa: number;
  cteDelaminationRisk: boolean;
  recommendedInterlayerMm: number;
}

export interface LaminateLayer {
  name: string;
  thicknessMm: number;
  EGpa: number;
  kWmK: number;
}

export function buildLaminateStack(p: DesignParams): LaminateLayer[] {
  return [
    { name: 'Outer glass', thicknessMm: 2.0, EGpa: 72, kWmK: 1.05 },
    { name: 'OCA upper', thicknessMm: 0.5, EGpa: p.adhesiveModulusGPa, kWmK: 0.18 },
    { name: 'Core', thicknessMm: p.substrateThicknessMm, EGpa: p.basePolymer === 'Glass' ? 72 : 2.5, kWmK: 0.15 },
    { name: 'OCA lower', thicknessMm: 0.5, EGpa: p.adhesiveModulusGPa, kWmK: 0.18 },
    { name: 'Inner glass', thicknessMm: 2.0, EGpa: 72, kWmK: 1.05 },
  ];
}

export function computeNeutralAxis(layers: LaminateLayer[]): { zNA: number; totalMm: number } {
  let z = 0, num = 0, den = 0;
  for (const L of layers) {
    const zBar = z + L.thicknessMm / 2;
    num += L.EGpa * L.thicknessMm * zBar;
    den += L.EGpa * L.thicknessMm;
    z += L.thicknessMm;
  }
  return { zNA: den === 0 ? 0 : num / den, totalMm: z };
}

export function computePhysics(p: DesignParams, Gsolar = 1000, Tamb = 25): PhysicsMetrics {
  const nCore = p.basePolymer === 'Zeonex_150ppm' ? 1.53 : p.basePolymer === 'PMMA' ? 1.49 : p.basePolymer === 'Polycarbonate' ? 1.58 : 1.52;
  const trap = Math.sqrt(Math.max(0, 1 - Math.pow(1.42 / nCore, 2)));
  const pathF = p.latticeGeometry === 'Penrose_P3' ? 2.4 : p.latticeGeometry === 'E8_Projection' ? 2.6 : 1.8;
  const fret = p.dyeDopant === 'None' ? 0.1 : Math.min(0.98, p.frettingEfficiency * (p.dyeConcentrationPpm >= 100 && p.dyeConcentrationPpm <= 150 ? 1 : 0.85));
  const tVis = p.basePolymer === 'Zeonex_150ppm' ? 0.93 : p.basePolymer === 'PMMA' ? 0.9 : 0.86;
  const haze = p.latticeGeometry === 'Penrose_P3' ? 1.1 : 2.2;
  const pvEta = p.pvMaterial === 'GaAs' ? 0.28 : p.pvMaterial === 'c-Si' ? 0.22 : p.pvMaterial === 'Perovskite' ? 0.24 : 0.15;
  const match = p.pvMaterial === 'GaAs' ? 1 : p.pvMaterial === 'c-Si' ? 0.92 : 0.7;
  const etaEl = Math.min(0.28, pvEta * match * trap * fret * 0.72) * 100;
  const kGas = p.cavityGas === 'Krypton' ? 0.009 : p.cavityGas === 'Argon' ? 0.017 : 0.026;
  const hGap = kGas / 0.012;
  const hRad = 4 * 5.67e-8 * Math.pow(293, 3) * Math.max(0.02, p.lowEEmissivity);
  const Rgap = 1 / (hGap + hRad);
  const U = Math.max(0.4, Math.min(2.5, 1 / (1 / 8.5 + 0.004 + Rgap + 1 / 25 + p.thermalBreakWidthMm / 1000 / 0.25)));
  const etaTh = Math.min(58, 42 + (1 - U / 2) * 20 + (p.massFlowKgS >= 0.12 && p.massFlowKgS <= 0.15 ? 6 : 0));
  const powerWm2 = (etaEl / 100) * Gsolar;
  const alphaSol = 0.55 + (1 - tVis) * 0.3;
  const qLoss = alphaSol * Gsolar - powerWm2 - (etaTh / 100) * alphaSol * Gsolar;
  const cellTemp = Tamb + qLoss / 15;
  const dT = p.massFlowKgS > 0.01 ? ((etaTh / 100) * alphaSol * Gsolar * p.panelWidthM * p.panelHeightM) / (p.massFlowKgS * p.coolantCp) : 0;
  const layers = buildLaminateStack(p);
  const { zNA } = computeNeutralAxis(layers);
  const sigma = 12 + p.substrateThicknessMm * 0.5;
  const shgc = Math.max(0.18, Math.min(0.45, 0.36 - p.lowEEmissivity * 0.1 + (tVis - 0.9) * 0.2));
  const wvtr = p.barrierType === 'Multi_ALD_AlN_SiO2' ? 1e-6 : p.barrierType === 'None' ? 1e-2 : 1e-5;

  const hydro = computeHydronicParasitic(p.massFlowKgS, cellTemp, p.panelWidthM, p.panelHeightM);
  const areaM2 = Math.max(0.1, p.panelWidthM * p.panelHeightM);
  const grossW = powerWm2 * areaM2;
  const netPowerDensityWm2 = Math.max(0, (grossW - hydro.pumpPowerW) / areaM2);

  const cte = checkThermalStress(
    [
      { name: 'glass', alpha: 8.5e-6, EGpa: 72, thicknessMm: 2.0 },
      { name: 'oca', alpha: 80e-6, EGpa: p.adhesiveModulusGPa, thicknessMm: 0.5 },
      { name: 'core', alpha: 60e-6, EGpa: p.basePolymer === 'Glass' ? 72 : 2.5, thicknessMm: p.substrateThicknessMm },
      { name: 'oca', alpha: 80e-6, EGpa: p.adhesiveModulusGPa, thicknessMm: 0.5 },
      { name: 'glass', alpha: 8.5e-6, EGpa: 72, thicknessMm: 2.0 },
    ],
    50,
  );

  return {
    opticalTransparency: Math.round(tVis * 1000) / 1000,
    hazePct: haze,
    pathLengthEnhancement: pathF,
    fretEfficiency: fret,
    trapFraction: Math.round(trap * 1000) / 1000,
    alphaSol: Math.round(alphaSol * 1000) / 1000,
    electricalEfficiencyPct: Math.round(etaEl * 100) / 100,
    thermalEfficiencyPct: Math.round(etaTh * 100) / 100,
    powerDensityWm2: Math.round(powerWm2 * 10) / 10,
    combinedYieldWm2: Math.round((powerWm2 + (etaTh / 100) * alphaSol * Gsolar) * 10) / 10,
    uFactor: Math.round(U * 1000) / 1000,
    shgc: Math.round(shgc * 1000) / 1000,
    cellTempC: Math.round(cellTemp * 10) / 10,
    fluidDeltaT: Math.round(dT * 100) / 100,
    neutralAxisMm: Math.round(zNA * 100) / 100,
    maxFlexuralStressMPa: Math.round(sigma * 10) / 10,
    wvtr,
    nocturnalLunarWm2: 0.3,
    nocturnalTEGWm2: 2.5,
    nocturnalDeltaT: 8,
    nfrc100Pass: U <= 0.85,
    nfrc200Pass: shgc >= 0.2 && shgc <= 0.4,
    dp105Capable: sigma < 50,
    nec690Pass: p.inverterTopology === 'Buck_Boost_DC_DC' || p.inverterTopology === 'Microinverter',
    ul61730Pass: true,
    ieee1547Pass: true,
    pumpPowerW: hydro.pumpPowerW,
    netPowerDensityWm2: Math.round(netPowerDensityWm2 * 10) / 10,
    fluidViscosityPaS: hydro.viscosityPaS,
    frictionFactor: hydro.frictionFactor,
    tauMaxKPa: cte.tauMaxKPa,
    tauYieldKPa: cte.tauYieldKPa,
    cteDelaminationRisk: cte.delaminationRisk,
    recommendedInterlayerMm: cte.recommendedInterlayerMm,
  };
}

export function evaluateHamiltonian(m: PhysicsMetrics): number {
  return (
    (m.uFactor > 0.85 ? 5 * (m.uFactor - 0.85) : 0) +
    (m.nfrc200Pass ? 0 : 3) +
    (m.dp105Capable ? 0 : 4) -
    m.electricalEfficiencyPct * 0.05 -
    m.thermalEfficiencyPct * 0.02
  );
}

export function paramsToLabels(p: DesignParams): { key: string; value: string }[] {
  return [
    { key: 'P1 Polymer', value: p.basePolymer },
    { key: 'P2 Core mm', value: String(p.substrateThicknessMm) },
    { key: 'P3 Lattice', value: p.latticeGeometry },
    { key: 'P6 Dye', value: p.dyeDopant },
    { key: 'P7 Dye ppm', value: String(p.dyeConcentrationPpm) },
    { key: 'P14 Edge PV', value: p.pvMaterial },
    { key: 'P17 ṁ kg/s', value: String(p.massFlowKgS) },
    { key: 'Cavity gas', value: p.cavityGas },
    { key: 'Low-E ε', value: String(p.lowEEmissivity) },
    { key: 'P22 Thermal break mm', value: String(p.thermalBreakWidthMm) },
    { key: 'Barrier', value: p.barrierType },
    { key: 'Inverter', value: p.inverterTopology },
  ];
}

export interface LocationConfig {
  name: string; latitudeDeg: number; avgIrradianceKwhM2Day: number;
  avgAmbientC: number; winterAmbientC: number; summerAmbientC: number;
  electricityUsdPerKwh: number; heatingFuelUsdPerTherm: number;
}

export const PRESET_LOCATIONS: LocationConfig[] = [
  { name: 'Boston, MA', latitudeDeg: 42.36, avgIrradianceKwhM2Day: 3.8, avgAmbientC: 10, winterAmbientC: -2, summerAmbientC: 24, electricityUsdPerKwh: 0.28, heatingFuelUsdPerTherm: 1.8 },
  { name: 'Phoenix, AZ', latitudeDeg: 33.45, avgIrradianceKwhM2Day: 5.7, avgAmbientC: 24, winterAmbientC: 12, summerAmbientC: 38, electricityUsdPerKwh: 0.14, heatingFuelUsdPerTherm: 1.2 },
  { name: 'Seattle, WA', latitudeDeg: 47.61, avgIrradianceKwhM2Day: 3.2, avgAmbientC: 11, winterAmbientC: 4, summerAmbientC: 20, electricityUsdPerKwh: 0.12, heatingFuelUsdPerTherm: 1.5 },
  { name: 'Miami, FL', latitudeDeg: 25.76, avgIrradianceKwhM2Day: 5.1, avgAmbientC: 25, winterAmbientC: 18, summerAmbientC: 30, electricityUsdPerKwh: 0.15, heatingFuelUsdPerTherm: 1.4 },
  { name: 'Denver, CO', latitudeDeg: 39.74, avgIrradianceKwhM2Day: 4.9, avgAmbientC: 10, winterAmbientC: -5, summerAmbientC: 28, electricityUsdPerKwh: 0.13, heatingFuelUsdPerTherm: 1.1 },
  { name: 'Custom / Lab', latitudeDeg: 40, avgIrradianceKwhM2Day: 4.5, avgAmbientC: 15, winterAmbientC: 0, summerAmbientC: 30, electricityUsdPerKwh: 0.16, heatingFuelUsdPerTherm: 1.5 },
];

export interface AnnualYieldResult {
  location: LocationConfig; tiltDeg: number;
  annualElectricKwhPerM2: number; annualThermalKwhPerM2: number; annualThermalBtuPerM2: number;
  year1ElectricKwh: number; year1ThermalBtu: number;
  year5ElectricKwh: number; year5ThermalBtu: number;
  year25ElectricKwh: number; year25ThermalBtu: number;
  year1SavingsUsd: number; year5SavingsUsd: number; year25SavingsUsd: number;
  paybackYears: number; roi25Pct: number;
  monthlyElectricKwh: number[]; monthlyThermalBtu: number[];
}

const MONTH_FRAC = [0.06, 0.07, 0.09, 0.1, 0.11, 0.11, 0.11, 0.1, 0.09, 0.07, 0.05, 0.04];

export function simulateAnnualYield(
  location: LocationConfig, tiltDeg: number, etaElPct: number, etaThPct: number, areaM2: number, bomCostUsd: number,
): AnnualYieldResult {
  const lat = location.latitudeDeg;
  const optTilt = Math.max(0, Math.min(60, lat * 0.9));
  const tiltFactor = 0.85 + 0.2 * Math.cos(((tiltDeg - optTilt) * Math.PI) / 180);
  const Gday = location.avgIrradianceKwhM2Day * tiltFactor;
  const etaEl = etaElPct / 100;
  const etaTh = etaThPct / 100;
  const annualElectricKwhPerM2 = Gday * 365 * etaEl;
  const annualThermalKwhPerM2 = Gday * 365 * etaTh;
  const annualThermalBtuPerM2 = annualThermalKwhPerM2 * 3412.14;
  const pvDeg = 0.005; const thDeg = 0.003;
  let eCum = 0, tCum = 0;
  const monthlyElectricKwh: number[] = [];
  const monthlyThermalBtu: number[] = [];
  for (let m = 0; m < 12; m++) {
    monthlyElectricKwh.push(Math.round(annualElectricKwhPerM2 * MONTH_FRAC[m] * areaM2 * 10) / 10);
    monthlyThermalBtu.push(Math.round(annualThermalBtuPerM2 * MONTH_FRAC[m] * areaM2));
  }
  for (let y = 0; y < 25; y++) {
    eCum += annualElectricKwhPerM2 * areaM2 * Math.pow(1 - pvDeg, y);
    tCum += annualThermalBtuPerM2 * areaM2 * Math.pow(1 - thDeg, y);
  }
  let e5 = 0, t5 = 0;
  for (let y = 0; y < 5; y++) {
    e5 += annualElectricKwhPerM2 * areaM2 * Math.pow(1 - pvDeg, y);
    t5 += annualThermalBtuPerM2 * areaM2 * Math.pow(1 - thDeg, y);
  }
  const year1ElectricKwh = annualElectricKwhPerM2 * areaM2;
  const year1ThermalBtu = annualThermalBtuPerM2 * areaM2;
  const elecRate = location.electricityUsdPerKwh;
  const heatRate = location.heatingFuelUsdPerTherm / 100000;
  const year1SavingsUsd = year1ElectricKwh * elecRate + year1ThermalBtu * heatRate;
  const year5SavingsUsd = e5 * elecRate + t5 * heatRate;
  const year25SavingsUsd = eCum * elecRate + tCum * heatRate;
  const paybackYears = year1SavingsUsd > 0 ? Math.round((bomCostUsd / year1SavingsUsd) * 10) / 10 : 99;
  const roi25Pct = bomCostUsd > 0 ? Math.round(((year25SavingsUsd - bomCostUsd) / bomCostUsd) * 1000) / 10 : 0;
  return {
    location, tiltDeg,
    annualElectricKwhPerM2: Math.round(annualElectricKwhPerM2 * 10) / 10,
    annualThermalKwhPerM2: Math.round(annualThermalKwhPerM2 * 10) / 10,
    annualThermalBtuPerM2: Math.round(annualThermalBtuPerM2),
    year1ElectricKwh: Math.round(year1ElectricKwh * 10) / 10,
    year1ThermalBtu: Math.round(year1ThermalBtu),
    year5ElectricKwh: Math.round(e5 * 10) / 10,
    year5ThermalBtu: Math.round(t5),
    year25ElectricKwh: Math.round(eCum * 10) / 10,
    year25ThermalBtu: Math.round(tCum),
    year1SavingsUsd: Math.round(year1SavingsUsd * 100) / 100,
    year5SavingsUsd: Math.round(year5SavingsUsd * 100) / 100,
    year25SavingsUsd: Math.round(year25SavingsUsd * 100) / 100,
    paybackYears, roi25Pct, monthlyElectricKwh, monthlyThermalBtu,
  };
}

export interface DegradationResult {
  year: number; etaElRetention: number; etaThRetention: number;
  hazePct: number; sealStressFactor: number; overallRetention: number;
}

export function simulateDegradation25y(dyePpm: number, hasAldBarrier: boolean, thermalBreakMm: number): DegradationResult[] {
  const results: DegradationResult[] = [];
  const bleachRate = hasAldBarrier ? 0.004 : 0.012;
  const dyeFactor = Math.min(1.5, dyePpm / 125);
  for (let y = 0; y <= 25; y++) {
    const pvRet = Math.pow(1 - 0.005, y);
    const dyeRet = Math.exp(-bleachRate * dyeFactor * y);
    const hazePct = Math.min(8, 1.1 + y * (hasAldBarrier ? 0.08 : 0.22));
    const hazeLoss = 1 - (hazePct - 1.1) * 0.02;
    const sealStress = Math.min(1.2, 1 + y * 0.008 * (18 / Math.max(8, thermalBreakMm)));
    const etaElRetention = Math.max(0.55, pvRet * dyeRet * hazeLoss);
    const etaThRetention = Math.max(0.65, Math.pow(1 - 0.003, y) * (2 - sealStress));
    const overallRetention = 0.6 * etaElRetention + 0.4 * etaThRetention;
    results.push({
      year: y,
      etaElRetention: Math.round(etaElRetention * 1000) / 1000,
      etaThRetention: Math.round(etaThRetention * 1000) / 1000,
      hazePct: Math.round(hazePct * 100) / 100,
      sealStressFactor: Math.round(sealStress * 1000) / 1000,
      overallRetention: Math.round(overallRetention * 1000) / 1000,
    });
  }
  return results;
}

export interface CteLayer { name: string; alpha: number; EGpa: number; thicknessMm: number; }

export interface ThermalStressResult {
  deltaT: number; tauMaxKPa: number; tauYieldKPa: number; delaminationRisk: boolean;
  recommendedInterlayerMm: number; glassAlpha: number; polymerAlpha: number; frameAlpha: number;
  differentialStrain: number; message: string;
}

export function checkThermalStress(stack: CteLayer[], deltaT: number, interlayerThicknessMm = 0.5): ThermalStressResult {
  const glassAlpha = 8.5e-6;
  const polymerAlpha = 60e-6;
  const frameAlpha = 23e-6;
  const differentialStrain = Math.abs((polymerAlpha - glassAlpha) * deltaT);
  const EocaGpa = stack.find((s) => s.name === 'oca')?.EGpa ?? 1.2;
  const GinterMPa = Math.max(0.15, EocaGpa / 3);
  const LedgeMm = 8;
  const h = Math.max(0.3, interlayerThicknessMm);
  const tauMaxKPa = GinterMPa * differentialStrain * (LedgeMm / h) * 12 * 1000;
  const tauYieldKPa = 800;
  let recommended = interlayerThicknessMm;
  if (tauMaxKPa > tauYieldKPa * 0.9) {
    recommended = Math.min(1.0, Math.max(0.5, h * (tauMaxKPa / (tauYieldKPa * 0.75))));
  }
  const tauAtRec = GinterMPa * differentialStrain * (LedgeMm / Math.max(0.3, recommended)) * 12 * 1000;
  const delaminationRisk = tauAtRec >= tauYieldKPa;
  return {
    deltaT,
    tauMaxKPa: Math.round(tauMaxKPa * 10) / 10,
    tauYieldKPa,
    delaminationRisk,
    recommendedInterlayerMm: Math.round(recommended * 100) / 100,
    glassAlpha, polymerAlpha, frameAlpha,
    differentialStrain: Math.round(differentialStrain * 1e6) / 1e6,
    message: delaminationRisk
      ? `CTE shear τ=${tauAtRec.toFixed(0)} kPa exceeds yield — increase OCA/EVA to ≥${recommended.toFixed(2)} mm`
      : `CTE shear OK: τ_max=${tauMaxKPa.toFixed(0)} kPa < τ_yield=${tauYieldKPa} kPa (interlayer ${recommended} mm)`,
  };
}

export interface HydronicParasiticResult {
  viscosityPaS: number; densityKgM3: number; frictionFactor: number;
  pressureDropPa: number; pumpPowerW: number; reynolds: number; fluidLabel: string;
}

export function computeHydronicParasitic(
  massFlowKgS: number, fluidTempC: number, widthM: number, heightM: number,
): HydronicParasiticResult {
  const T = Math.max(-20, Math.min(80, fluidTempC));
  const mu = 0.0065 * Math.exp(850 / (T + 273.15) - 850 / 293.15);
  const rho = 1040 - 0.35 * (T - 20);
  const tubeIdM = 0.00465;
  const perimeterLoopM = 2 * (widthM + heightM) + 0.4;
  const area = Math.PI * (tubeIdM / 2) ** 2;
  const mDot = Math.max(0.01, massFlowKgS);
  const v = mDot / (rho * area);
  const Re = (rho * v * tubeIdM) / mu;
  const f = Re < 2300 ? 64 / Math.max(Re, 1) : 0.316 / Math.pow(Re, 0.25);
  const dP = f * (perimeterLoopM / tubeIdM) * 0.5 * rho * v * v;
  const P_hyd = mDot * (dP / rho);
  const pumpPowerW = Math.min(25, Math.max(0.5, P_hyd / 0.35));
  return {
    viscosityPaS: Math.round(mu * 1e5) / 1e5,
    densityKgM3: Math.round(rho * 10) / 10,
    frictionFactor: Math.round(f * 1000) / 1000,
    pressureDropPa: Math.round(dP),
    pumpPowerW: Math.round(pumpPowerW * 100) / 100,
    reynolds: Math.round(Re),
    fluidLabel: '40/60 Propylene Glycol / Water',
  };
}
