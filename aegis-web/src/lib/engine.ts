/**
 * AegisSash 22-parameter BIPV-T physics engine
 * Derived from Master Specification (PDF): photonic-thermal fenestration digital twin
 */

export interface DesignParams {
  basePolymer: 'PMMA' | 'Zeonex_150ppm' | 'Polycarbonate' | 'Glass';
  substrateThicknessMm: number;
  latticeGeometry: 'Square' | 'Hexagonal' | 'Penrose_P3' | 'E8_Projection';
  latticePitchNm: number;
  fillFactor: number;
  dyeDopant: 'None' | 'Lumogen_Yellow_083' | 'Lumogen_Red_305';
  dyeConcentrationPpm: number;
  qdCore: 'InP' | 'CuInS2' | 'CdSe' | 'CsPbBr3';
  qdShell: 'ZnS' | 'ZnSe' | 'Dual_ZnS_ZnSe';
  qdDiameterNm: number;
  qdConcentrationPpm: number;
  barrierType: 'None' | 'Single_Layer_ALD_AlN' | 'Multi_ALD_AlN_SiO2';
  aldThicknessNm: number;
  pvMaterial: 'c-Si' | 'GaAs' | 'GaN' | 'SiC' | 'Perovskite';
  hydronicDiameterMm: number;
  coolantFluid: 'Pure_H2O' | 'Ethylene_Glycol_50_50' | 'Nano_Fluid';
  massFlowKgS: number;
  inverterTopology: 'Central_Inverter' | 'Microinverter' | 'Buck_Boost_DC_DC';
  adhesiveModulusGPa: number;
  glassModulusGPa: number;
  surfaceCoating: 'None' | 'Fluoropolymer' | 'TiO2_Photocatalytic';
  thermalBreakWidthMm: number;
}

export const DEFAULT_PARAMS: DesignParams = {
  basePolymer: 'Zeonex_150ppm',
  substrateThicknessMm: 4.0,
  latticeGeometry: 'Penrose_P3',
  latticePitchNm: 520,
  fillFactor: 0.22,
  dyeDopant: 'Lumogen_Red_305',
  dyeConcentrationPpm: 150,
  qdCore: 'InP',
  qdShell: 'ZnS',
  qdDiameterNm: 3.2,
  qdConcentrationPpm: 450,
  barrierType: 'Multi_ALD_AlN_SiO2',
  aldThicknessNm: 35,
  pvMaterial: 'GaN',
  hydronicDiameterMm: 6.0,
  coolantFluid: 'Ethylene_Glycol_50_50',
  massFlowKgS: 0.12,
  inverterTopology: 'Buck_Boost_DC_DC',
  adhesiveModulusGPa: 1.2,
  glassModulusGPa: 72,
  surfaceCoating: 'Fluoropolymer',
  thermalBreakWidthMm: 18,
};

export interface PhysicsMetrics {
  opticalTransparency: number;
  hazePct: number;
  pathLengthEnhancement: number;
  fretEfficiency: number;
  trapFraction: number;
  electricalEfficiencyPct: number;
  thermalEfficiencyPct: number;
  uFactor: number;
  shgc: number;
  cellTempC: number;
  fluidDeltaT: number;
  powerDensityWm2: number;
  thermalPowerWm2: number;
  neutralAxisMm: number;
  maxFlexuralStressMPa: number;
  wvtr: number;
  nocturnalTEGWm2: number;
  combinedYieldWm2: number;
  nfrc100Pass: boolean;
  nfrc200Pass: boolean;
  dp105Capable: boolean;
}

const POLYMER_N: Record<string, number> = { PMMA: 1.49, Zeonex_150ppm: 1.53, Polycarbonate: 1.58, Glass: 1.52 };
const POLYMER_E: Record<string, number> = { PMMA: 3.0, Zeonex_150ppm: 2.1, Polycarbonate: 2.3, Glass: 72 };
const PV_ETA: Record<string, number> = { 'c-Si': 0.22, GaAs: 0.28, GaN: 0.18, SiC: 0.12, Perovskite: 0.24 };
const CP_FLUID: Record<string, number> = { Pure_H2O: 4.18, Ethylene_Glycol_50_50: 3.55, Nano_Fluid: 3.8 };

function neutralAxis(layers: { E: number; t: number; zBar: number }[]): number {
  let num = 0, den = 0;
  for (const L of layers) { num += L.E * L.t * L.zBar; den += L.E * L.t; }
  return den === 0 ? 0 : num / den;
}

function fretEff(dyePpm: number, qdPpm: number): number {
  const r = 4.5 / Math.sqrt(Math.max(1, (dyePpm + qdPpm) / 600));
  const R0 = 5.5;
  const ratio = Math.pow(R0 / Math.max(0.1, r), 6);
  return Math.min(0.99, ratio / (1 + ratio));
}

function pathEnhancement(geom: string, pitchNm: number, fill: number): number {
  const base = geom === 'Penrose_P3' ? 8.5 : geom === 'E8_Projection' ? 7.2 : geom === 'Hexagonal' ? 5.5 : 4.2;
  const pitchFactor = 1 + 0.15 * Math.exp(-Math.pow((pitchNm - 520) / 200, 2));
  const fillFactor = 1 + 0.25 * (1 - Math.abs(fill - 0.22) / 0.22);
  return base * pitchFactor * fillFactor;
}

export function computePhysics(p: DesignParams, Gsolar = 1000, Tamb = 25): PhysicsMetrics {
  const nCore = POLYMER_N[p.basePolymer] ?? 1.53;
  const Ecore = POLYMER_E[p.basePolymer] ?? 2.1;
  const etaPV = PV_ETA[p.pvMaterial] ?? 0.18;
  const Cp = CP_FLUID[p.coolantFluid] ?? 3.55;

  let Tvis = p.basePolymer === 'Zeonex_150ppm' ? 0.92 : p.basePolymer === 'PMMA' ? 0.9 : 0.88;
  Tvis -= 0.00004 * p.dyeConcentrationPpm + 0.000015 * p.qdConcentrationPpm;
  Tvis = Math.max(0.55, Math.min(0.95, Tvis));

  const haze = (p.latticeGeometry === 'Penrose_P3' ? 1.1 : 2.4) + Math.abs(p.fillFactor - 0.22) * 8 + (p.dyeConcentrationPpm / 500) * 1.2;
  const F = pathEnhancement(p.latticeGeometry, p.latticePitchNm, p.fillFactor);
  const E_fret = p.dyeDopant === 'None' ? 0.4 : fretEff(p.dyeConcentrationPpm, p.qdConcentrationPpm);
  const nClad = 1.42;
  const trap = Math.sqrt(Math.max(0, 1 - Math.pow(nClad / nCore, 2)));

  const stokesBonus = p.qdCore === 'InP' && p.qdShell !== 'ZnS' ? 1.05 : 1.0;
  let etaEl = etaPV * trap * E_fret * (0.55 + 0.08 * Math.log10(F)) * stokesBonus * (Tvis / 0.9);
  const coolingBenefit = Math.min(1.08, 1 + 0.15 * Math.min(1, p.massFlowKgS / 0.15));
  etaEl = Math.min(0.28, etaEl * coolingBenefit);
  const electricalEfficiencyPct = etaEl * 100;

  const alphaSol = 0.72 - Tvis * 0.25;
  let etaTh = alphaSol * 0.78 * (1 - 0.12 * Math.exp(-p.massFlowKgS / 0.08));
  if (p.barrierType === 'Multi_ALD_AlN_SiO2') etaTh += 0.02;
  etaTh = Math.min(0.62, Math.max(0.25, etaTh));
  const thermalEfficiencyPct = etaTh * 100;

  const glassT = 2.0, coreT = p.substrateThicknessMm, breakW = p.thermalBreakWidthMm;
  let U = 1.0 / (1 / 8.5 + glassT / 1000 / 1.05 + coreT / 1000 / 0.14 + glassT / 1000 / 1.05 + 1 / 25 + breakW / 1000 / 0.2);
  if (p.barrierType !== 'None') U *= 0.92;
  U = Math.max(0.55, Math.min(2.2, U));

  const shgc = Math.max(0.18, Math.min(0.45, 0.38 - p.dyeConcentrationPpm / 2500 - (1 - Tvis) * 0.15));
  const Tcell = Tamb + (Gsolar * (alphaSol - etaEl)) / (U * 12 + p.massFlowKgS * Cp * 80);
  const fluidDeltaT = (etaTh * Gsolar) / (Math.max(0.01, p.massFlowKgS) * Cp * 1000) * 0.35;
  const dT = Math.max(8, Math.min(40, fluidDeltaT * 1000 + 12));

  const powerDensityWm2 = etaEl * Gsolar;
  const thermalPowerWm2 = etaTh * Gsolar;

  const layers = [
    { E: p.glassModulusGPa, t: 2.0, zBar: 1.0 },
    { E: p.adhesiveModulusGPa, t: 0.5, zBar: 2.25 },
    { E: Ecore, t: coreT, zBar: 2.5 + coreT / 2 },
    { E: p.adhesiveModulusGPa, t: 0.5, zBar: 2.5 + coreT + 0.25 },
    { E: p.glassModulusGPa, t: 2.0, zBar: 3.0 + coreT },
  ];
  const zNA = neutralAxis(layers);
  const Ieq = layers.reduce((s, L) => s + (L.E / 72) * (L.t * Math.pow(L.t / 2, 2) / 3), 0.5);
  const sigmaMax = (5.02e3 * Math.pow(1.2, 2) * (layers[layers.length - 1].zBar - zNA)) / (Ieq * 1e6);
  const maxFlexuralStressMPa = Math.max(2, Math.min(45, sigmaMax));

  const wvtr = p.barrierType === 'Multi_ALD_AlN_SiO2' ? 1e-6 : p.barrierType === 'Single_Layer_ALD_AlN' ? 5e-5 : 0.1;
  const nocturnalTEGWm2 = p.surfaceCoating === 'Fluoropolymer' || p.surfaceCoating === 'TiO2_Photocatalytic' ? 4.5 : 1.2;
  const combinedYieldWm2 = powerDensityWm2 + thermalPowerWm2 * 0.35 + nocturnalTEGWm2 * 0.1;

  return {
    opticalTransparency: Math.round(Tvis * 1000) / 1000,
    hazePct: Math.round(haze * 100) / 100,
    pathLengthEnhancement: Math.round(F * 100) / 100,
    fretEfficiency: Math.round(E_fret * 1000) / 1000,
    trapFraction: Math.round(trap * 1000) / 1000,
    electricalEfficiencyPct: Math.round(electricalEfficiencyPct * 100) / 100,
    thermalEfficiencyPct: Math.round(thermalEfficiencyPct * 100) / 100,
    uFactor: Math.round(U * 1000) / 1000,
    shgc: Math.round(shgc * 1000) / 1000,
    cellTempC: Math.round(Tcell * 10) / 10,
    fluidDeltaT: Math.round(dT * 10) / 10,
    powerDensityWm2: Math.round(powerDensityWm2 * 10) / 10,
    thermalPowerWm2: Math.round(thermalPowerWm2 * 10) / 10,
    neutralAxisMm: Math.round(zNA * 100) / 100,
    maxFlexuralStressMPa: Math.round(maxFlexuralStressMPa * 10) / 10,
    wvtr,
    nocturnalTEGWm2,
    combinedYieldWm2: Math.round(combinedYieldWm2 * 10) / 10,
    nfrc100Pass: U <= 0.85,
    nfrc200Pass: shgc >= 0.2 && shgc <= 0.4,
    dp105Capable: maxFlexuralStressMPa < 40 && zNA > 2.5,
  };
}

export function paramsToLabels(p: DesignParams): { key: string; value: string }[] {
  return [
    { key: 'P1 Matrix polymer', value: p.basePolymer },
    { key: 'P2 Substrate t', value: `${p.substrateThicknessMm} mm` },
    { key: 'P3 Lattice', value: p.latticeGeometry },
    { key: 'P4 Pitch', value: `${p.latticePitchNm} nm` },
    { key: 'P5 Fill factor', value: String(p.fillFactor) },
    { key: 'P6 Dye', value: p.dyeDopant },
    { key: 'P7 Dye conc.', value: `${p.dyeConcentrationPpm} ppm` },
    { key: 'P8 QD core', value: p.qdCore },
    { key: 'P9 QD shell', value: p.qdShell },
    { key: 'P10 QD diameter', value: `${p.qdDiameterNm} nm` },
    { key: 'P11 QD conc.', value: `${p.qdConcentrationPpm} ppm` },
    { key: 'P12 Barrier', value: p.barrierType },
    { key: 'P13 ALD t', value: `${p.aldThicknessNm} nm` },
    { key: 'P14 Edge PV', value: p.pvMaterial },
    { key: 'P15 Channel Ø', value: `${p.hydronicDiameterMm} mm` },
    { key: 'P16 Coolant', value: p.coolantFluid },
    { key: 'P17 ṁ', value: `${p.massFlowKgS} kg/s` },
    { key: 'P18 Inverter', value: p.inverterTopology },
    { key: 'P19 E adhesive', value: `${p.adhesiveModulusGPa} GPa` },
    { key: 'P20 E glass', value: `${p.glassModulusGPa} GPa` },
    { key: 'P21 Coating', value: p.surfaceCoating },
    { key: 'P22 Thermal break', value: `${p.thermalBreakWidthMm} mm` },
  ];
}
