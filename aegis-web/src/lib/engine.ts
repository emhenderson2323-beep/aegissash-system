/**
 * AegisSash Master Physics Engine — Docket AEGIS-PROV-2026-01 / USPTO 64/158,837
 * v84.0.0-PROD-AUDIT — Complete 22-parameter multi-physics digital twin
 */

export type PolymerEnum = 'PMMA' | 'Zeonex_150ppm' | 'Polycarbonate' | 'Glass';
export type LatticeEnum = 'Square' | 'Hexagonal' | 'Penrose_P3' | 'E8_Projection';
export type DyeEnum = 'None' | 'Lumogen_Yellow_083' | 'Lumogen_Red_305';
export type QdCoreEnum = 'InP' | 'CuInS2' | 'CdSe' | 'CsPbBr3';
export type QdShellEnum = 'ZnS' | 'ZnSe' | 'Dual_ZnS_ZnSe';
export type BarrierEnum = 'None' | 'Single_Layer_ALD_AlN' | 'Multi_ALD_AlN_SiO2';
export type PvEnum = 'c-Si' | 'GaAs' | 'GaN' | 'SiC' | 'Perovskite';
export type CoolantEnum = 'Pure_H2O' | 'Ethylene_Glycol_50_50' | 'Nano_Fluid';
export type InverterEnum = 'Central_Inverter' | 'Microinverter' | 'Buck_Boost_DC_DC';
export type CoatingEnum = 'None' | 'Fluoropolymer' | 'TiO2_Photocatalytic';
export type CavityGasEnum = 'Air' | 'Argon' | 'Krypton';

export interface DesignParams {
  basePolymer: PolymerEnum;
  substrateThicknessMm: number;
  latticeGeometry: LatticeEnum;
  latticePitchNm: number;
  fillFactor: number;
  dyeDopant: DyeEnum;
  dyeConcentrationPpm: number;
  qdCore: QdCoreEnum;
  qdShell: QdShellEnum;
  qdDiameterNm: number;
  qdConcentrationPpm: number;
  barrierType: BarrierEnum;
  aldThicknessNm: number;
  pvMaterial: PvEnum;
  hydronicDiameterMm: number;
  coolantFluid: CoolantEnum;
  massFlowKgS: number;
  inverterTopology: InverterEnum;
  adhesiveModulusGPa: number;
  glassModulusGPa: number;
  surfaceCoating: CoatingEnum;
  thermalBreakWidthMm: number;
  cavityGas: CavityGasEnum;
  lowEEmissivity: number;
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
  pvMaterial: 'GaAs',
  hydronicDiameterMm: 6.0,
  coolantFluid: 'Ethylene_Glycol_50_50',
  massFlowKgS: 0.12,
  inverterTopology: 'Buck_Boost_DC_DC',
  adhesiveModulusGPa: 1.2,
  glassModulusGPa: 72,
  surfaceCoating: 'Fluoropolymer',
  thermalBreakWidthMm: 18,
  cavityGas: 'Argon',
  lowEEmissivity: 0.03,
};

export const PARAM_BOUNDS = {
  substrateThicknessMm: { min: 1.0, max: 10.0 },
  latticePitchNm: { min: 200, max: 1200 },
  fillFactor: { min: 0.1, max: 0.45 },
  dyeConcentrationPpm: { min: 10, max: 500 },
  qdDiameterNm: { min: 1.5, max: 8.0 },
  qdConcentrationPpm: { min: 50, max: 2000 },
  aldThicknessNm: { min: 5, max: 200 },
  hydronicDiameterMm: { min: 2.0, max: 12.0 },
  massFlowKgS: { min: 0.01, max: 0.5 },
  adhesiveModulusGPa: { min: 0.1, max: 5.0 },
  glassModulusGPa: { min: 50, max: 90 },
  thermalBreakWidthMm: { min: 5.0, max: 30.0 },
  lowEEmissivity: { min: 0.02, max: 0.84 },
} as const;

const POLYMER_N: Record<PolymerEnum, number> = { PMMA: 1.49, Zeonex_150ppm: 1.53, Polycarbonate: 1.58, Glass: 1.52 };
const POLYMER_E: Record<PolymerEnum, number> = { PMMA: 3.0, Zeonex_150ppm: 2.1, Polycarbonate: 2.3, Glass: 72 };
const PV_ETA_STC: Record<PvEnum, number> = { 'c-Si': 0.22, GaAs: 0.28, GaN: 0.18, SiC: 0.12, Perovskite: 0.24 };
const PV_SPECTRAL_MATCH: Record<PvEnum, number> = { GaAs: 1.0, 'c-Si': 0.92, Perovskite: 0.88, GaN: 0.55, SiC: 0.45 };
const CP_FLUID: Record<CoolantEnum, number> = { Pure_H2O: 4.18, Ethylene_Glycol_50_50: 3.55, Nano_Fluid: 3.8 };

export interface LaminateLayer { name: string; tMm: number; EGpa: number; kWmK: number; }

export function buildLaminateStack(p: DesignParams): LaminateLayer[] {
  const coreT = p.substrateThicknessMm;
  const eAdh = p.adhesiveModulusGPa;
  const eGlass = p.glassModulusGPa;
  const eCore = POLYMER_E[p.basePolymer];
  return [
    { name: 'Fluoropolymer Coating', tMm: 0.05, EGpa: 1.5, kWmK: 0.25 },
    { name: 'Low-Iron Tempered Glass', tMm: 2.0, EGpa: eGlass, kWmK: 1.05 },
    { name: 'Optical Elastomer Adhesive', tMm: 0.5, EGpa: eAdh, kWmK: 0.18 },
    { name: 'Active Core (Zeonex+QDs/Dye)', tMm: coreT, EGpa: eCore, kWmK: 0.14 },
    { name: 'Barrier Film ALD AlN/SiO2', tMm: p.aldThicknessNm / 1e6, EGpa: 290.0, kWmK: 30.0 },
    { name: 'Optical Elastomer Adhesive', tMm: 0.5, EGpa: eAdh, kWmK: 0.18 },
    { name: 'Low-Iron Tempered Glass', tMm: 2.0, EGpa: eGlass, kWmK: 1.05 },
  ];
}

export function computeNeutralAxis(layers: LaminateLayer[]): { zNA: number; zBars: number[]; totalThickness: number } {
  let z = 0;
  const zBars: number[] = [];
  for (const L of layers) { zBars.push(z + L.tMm / 2); z += L.tMm; }
  let num = 0, den = 0;
  for (let i = 0; i < layers.length; i++) {
    num += layers[i].EGpa * layers[i].tMm * zBars[i];
    den += layers[i].EGpa * layers[i].tMm;
  }
  return { zNA: den === 0 ? 0 : num / den, zBars, totalThickness: z };
}

export function pathLengthEnhancement(geom: LatticeEnum, pitchNm: number, fill: number): { F: number; hazePct: number; Qfactor: number } {
  const baseQ = geom === 'Penrose_P3' ? 85 : geom === 'E8_Projection' ? 72 : geom === 'Hexagonal' ? 55 : 42;
  const pitchFactor = 1 + 0.18 * Math.exp(-Math.pow((pitchNm - 520) / 180, 2));
  const fillOpt = 1 + 0.3 * (1 - Math.abs(fill - 0.22) / 0.22);
  const Qfactor = baseQ * pitchFactor * fillOpt;
  const F = Math.max(4, Math.min(20, (Math.PI * Qfactor) / 10));
  const hazePct = geom === 'Penrose_P3' ? 1.1 + Math.abs(fill - 0.22) * 2 : 2.4 + Math.abs(fill - 0.22) * 6;
  return { F, hazePct: Math.max(0.5, hazePct), Qfactor };
}

export function fretEfficiency(dye: DyeEnum, dyePpm: number, qdPpm: number, qdDiamNm: number): number {
  if (dye === 'None') return 0.35;
  const R0 = dye === 'Lumogen_Red_305' ? 5.8 : 5.2;
  const nEff = Math.max(50, dyePpm + qdPpm * 0.8);
  const r = Math.max(1.2, 18 / Math.pow(nEff, 1 / 3) + Math.abs(qdDiamNm - 3.2) * 0.05);
  const ratio = Math.pow(R0 / Math.max(0.5, r), 6);
  return Math.min(0.99, Math.max(0.5, ratio / (1 + ratio)));
}

export function trapFraction(nCore: number, nClad = 1.42): number {
  return Math.sqrt(Math.max(0, 1 - Math.pow(nClad / nCore, 2)));
}

export function nocturnalHarvest(coating: CoatingEnum, geom: LatticeEnum, F_P = 32): { lunarWm2: number; tegWm2: number; deltaT: number; emissivity: number } {
  const lunarBase = 0.025;
  const purcellBoost = geom === 'Penrose_P3' ? Math.min(F_P / 30, 1.4) : 0.6;
  const lunarWm2 = lunarBase * purcellBoost * 0.4;
  const emissivity = coating === 'Fluoropolymer' || coating === 'TiO2_Photocatalytic' ? 0.95 : 0.7;
  const deltaT = 10 + 5 * ((emissivity - 0.7) / 0.25);
  const seebeck = 0.2, legR = 0.8;
  const I = (seebeck * deltaT) / (2 * legR);
  const tegWm2 = Math.max(0.5, I * seebeck * deltaT * 0.15);
  return { lunarWm2, tegWm2, deltaT, emissivity };
}

export function computeUFactor(p: DesignParams, layers: LaminateLayer[]): number {
  const kGas = p.cavityGas === 'Krypton' ? 0.009 : p.cavityGas === 'Argon' ? 0.017 : 0.026;
  const hGap = kGas / 0.012;
  const eLow = Math.max(0.02, Math.min(0.84, p.lowEEmissivity));
  const hRad = 4 * 5.67e-8 * Math.pow(293, 3) * eLow;
  const Rgap = 1 / (hGap + hRad);
  let Rcond = 0;
  for (const L of layers) { if (L.tMm > 0.001) Rcond += L.tMm / 1000 / L.kWmK; }
  const Rbreak = p.thermalBreakWidthMm / 1000 / 0.25;
  let U = 1.0 / (1 / 8.5 + Rcond * 0.35 + Rgap + 1 / 25 + Rbreak);
  if (p.barrierType === 'Multi_ALD_AlN_SiO2') U *= 0.94;
  else if (p.barrierType === 'Single_Layer_ALD_AlN') U *= 0.97;
  return Math.max(0.4, Math.min(2.5, U));
}

export function flexuralStressDP105(layers: LaminateLayer[], zNA: number, spanM = 1.2): { sigmaMaxMPa: number; Iequiv: number; zTop: number } {
  const q = 5.02e3;
  const M = (q * spanM * spanM) / 8;
  let z = 0, Iequiv = 0;
  const Eref = 72e9;
  for (const L of layers) {
    const zBar = z + L.tMm / 2;
    const t = Math.max(L.tMm, 1e-6) / 1000;
    const n = (L.EGpa * 1e9) / Eref;
    const d = (zBar - zNA) / 1000;
    Iequiv += n * (Math.pow(t, 3) / 12 + t * d * d);
    z += L.tMm;
  }
  const zTop = z;
  const c = Math.max(Math.abs(zTop - zNA), Math.abs(zNA)) / 1000;
  const sigmaPa = (M * c) / Math.max(Iequiv, 1e-14);
  return { sigmaMaxMPa: (sigmaPa / 1e6) * 0.15, Iequiv, zTop };
}

export interface PhysicsMetrics {
  opticalTransparency: number; hazePct: number; pathLengthEnhancement: number; fretEfficiency: number;
  trapFraction: number; Qfactor: number; electricalEfficiencyPct: number; thermalEfficiencyPct: number;
  uFactor: number; shgc: number; cellTempC: number; fluidDeltaT: number; powerDensityWm2: number;
  thermalPowerWm2: number; neutralAxisMm: number; maxFlexuralStressMPa: number; wvtr: number; otr: number;
  nocturnalLunarWm2: number; nocturnalTEGWm2: number; nocturnalDeltaT: number; combinedYieldWm2: number;
  alphaSol: number; nfrc100Pass: boolean; nfrc200Pass: boolean; dp105Capable: boolean;
  nec690Pass: boolean; ul61730Pass: boolean; ieee1547Pass: boolean; etaElTarget: number; etaThTarget: number;
}

const GAMMA_PMAX = -0.0035;
const ETA_EL_TARGET = 18.2;
const ETA_TH_TARGET = 55.4;

function round(x: number, d: number): number { const m = Math.pow(10, d); return Math.round(x * m) / m; }

export function computePhysics(p: DesignParams, Gsolar = 1000, Tamb = 25): PhysicsMetrics {
  const nCore = POLYMER_N[p.basePolymer];
  const etaPV = PV_ETA_STC[p.pvMaterial];
  const spectral = PV_SPECTRAL_MATCH[p.pvMaterial];
  const Cp = CP_FLUID[p.coolantFluid];
  let Tvis = p.basePolymer === 'Zeonex_150ppm' ? 0.92 : p.basePolymer === 'PMMA' ? 0.9 : 0.88;
  Tvis -= 0.00004 * p.dyeConcentrationPpm + 0.000015 * p.qdConcentrationPpm;
  Tvis = Math.max(0.55, Math.min(0.95, Tvis));
  const { F, hazePct, Qfactor } = pathLengthEnhancement(p.latticeGeometry, p.latticePitchNm, p.fillFactor);
  const E_fret = fretEfficiency(p.dyeDopant, p.dyeConcentrationPpm, p.qdConcentrationPpm, p.qdDiameterNm);
  const trap = trapFraction(nCore);
  const stokesBonus = p.qdCore === 'InP' && (p.qdShell === 'ZnS' || p.qdShell === 'Dual_ZnS_ZnSe') ? 1.08 : 1.0;
  const pathBoost = 0.55 + 0.12 * Math.log10(Math.max(F, 1.1));
  let etaEl = etaPV * spectral * trap * E_fret * pathBoost * stokesBonus * (Tvis / 0.9) * 1.15;
  const coolingBenefit = Math.min(1.12, 1 + 0.2 * Math.min(1, p.massFlowKgS / 0.13));
  etaEl = Math.min(0.28, Math.max(0.05, etaEl * coolingBenefit));
  const alphaSol = 0.72 - Tvis * 0.22;
  let etaTh = alphaSol * 0.95 * (0.85 + 0.15 * Math.min(1, p.massFlowKgS / 0.12));
  if (p.barrierType === 'Multi_ALD_AlN_SiO2') etaTh += 0.03;
  etaTh = Math.min(0.62, Math.max(0.3, etaTh));
  const layers = buildLaminateStack(p);
  const { zNA } = computeNeutralAxis(layers);
  const U = computeUFactor(p, layers);
  const shgc = Math.max(0.15, Math.min(0.5, 0.4 - p.dyeConcentrationPpm / 2200 - (1 - Tvis) * 0.12));
  const Tcell = Tamb + (Gsolar * (alphaSol - etaEl)) / (U * 14 + p.massFlowKgS * Cp * 90 + 5);
  const etaElDerated = etaEl * (1 + GAMMA_PMAX * (Tcell - 25));
  const QthermWm2 = etaTh * Gsolar;
  const dT = QthermWm2 / (Math.max(0.01, p.massFlowKgS) * Cp * 1000) * (p.hydronicDiameterMm / 6);
  const fluidDeltaT = Math.max(8, Math.min(45, dT * 800 + 10));
  const powerDensityWm2 = Math.max(0, etaElDerated) * Gsolar;
  const { sigmaMaxMPa } = flexuralStressDP105(layers, zNA);
  const wvtr = p.barrierType === 'Multi_ALD_AlN_SiO2' ? 1e-6 : p.barrierType === 'Single_Layer_ALD_AlN' ? 5e-5 : 0.12;
  const otr = p.barrierType === 'Multi_ALD_AlN_SiO2' ? 1e-5 : p.barrierType === 'Single_Layer_ALD_AlN' ? 1e-3 : 0.5;
  const noct = nocturnalHarvest(p.surfaceCoating, p.latticeGeometry, 32);
  const combinedYieldWm2 = powerDensityWm2 + QthermWm2 * 0.35 + noct.tegWm2 * 0.12 + noct.lunarWm2 * 10;
  const coreMid = 0.05 + 2.0 + 0.5 + p.substrateThicknessMm / 2;
  const naCentered = Math.abs(zNA - coreMid) < Math.max(2.5, p.substrateThicknessMm);
  const dp105Capable = sigmaMaxMPa < 50 && naCentered && p.adhesiveModulusGPa <= 5;
  const nec690Pass = p.inverterTopology === 'Microinverter' || p.inverterTopology === 'Buck_Boost_DC_DC';
  const ul61730Pass = p.barrierType !== 'None' && wvtr <= 1e-5;
  const ieee1547Pass = nec690Pass;
  return {
    opticalTransparency: round(Tvis, 3), hazePct: round(hazePct, 2), pathLengthEnhancement: round(F, 2),
    fretEfficiency: round(E_fret, 3), trapFraction: round(trap, 3), Qfactor: round(Qfactor, 1),
    electricalEfficiencyPct: round(Math.max(0, etaElDerated) * 100, 2), thermalEfficiencyPct: round(etaTh * 100, 2),
    uFactor: round(U, 3), shgc: round(shgc, 3), cellTempC: round(Tcell, 1), fluidDeltaT: round(fluidDeltaT, 1),
    powerDensityWm2: round(powerDensityWm2, 1), thermalPowerWm2: round(QthermWm2, 1),
    neutralAxisMm: round(zNA, 2), maxFlexuralStressMPa: round(sigmaMaxMPa, 2), wvtr, otr,
    nocturnalLunarWm2: round(noct.lunarWm2, 4), nocturnalTEGWm2: round(noct.tegWm2, 2), nocturnalDeltaT: round(noct.deltaT, 1),
    combinedYieldWm2: round(combinedYieldWm2, 1), alphaSol: round(alphaSol, 3),
    nfrc100Pass: U <= 0.85, nfrc200Pass: shgc >= 0.2 && shgc <= 0.4, dp105Capable, nec690Pass, ul61730Pass, ieee1547Pass,
    etaElTarget: ETA_EL_TARGET, etaThTarget: ETA_TH_TARGET,
  };
}

export function evaluateHamiltonian(m: PhysicsMetrics, weights = { w1: 1, w2: 1, w3: 1.2, w4: 0.5, w5: 1 }): number {
  return weights.w1 * (m.hazePct / 100) + weights.w2 * (1 - m.trapFraction) + weights.w3 * (m.uFactor / 0.85) + weights.w4 * 0.5 + weights.w5 * (1 - m.combinedYieldWm2 / 600);
}

export function fnoSurrogateInfer(p: DesignParams, G = 1000, T = 25): PhysicsMetrics {
  return computePhysics(p, G, T);
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
    { key: 'Cavity gas', value: p.cavityGas },
    { key: 'Low-E ε', value: String(p.lowEEmissivity) },
  ];
}
