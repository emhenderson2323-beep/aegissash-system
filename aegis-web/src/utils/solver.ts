/**
 * Auto-corrector + QUBO Pareto + Inverse generative design
 * Docket AEGIS-PROV-2026-01
 */
import {
  DesignParams,
  DEFAULT_PARAMS,
  computePhysics,
  PhysicsMetrics,
  PARAM_BOUNDS,
} from '../lib/engine';
import {
  DynamicStackConfig,
  DynamicStackResult,
  SubstrateMat,
  CoatingMat,
  buildDynamicStack,
  SWEEP_SUBSTRATES,
  SWEEP_INTERLAYERS,
  SWEEP_COATINGS,
  SWEEP_GASES,
  SWEEP_PV,
  SWEEP_LAYERS,
} from '../lib/manufacturing';

export interface CorrectionLog {
  field: string;
  from: string | number;
  to: string | number;
  reason: string;
}

export interface AutoCorrectResult {
  params: DesignParams;
  metrics: PhysicsMetrics;
  corrections: CorrectionLog[];
  allPassing: boolean;
}

const BAND = {
  massFlowMin: 0.12,
  massFlowMax: 0.15,
  dyeMin: 100,
  dyeMax: 150,
  lowEMax: 0.04,
} as const;

export function autoCorrectParameters(
  input: DesignParams,
  Gsolar = 1000,
  Tamb = 25,
): AutoCorrectResult {
  const params: DesignParams = { ...input };
  const corrections: CorrectionLog[] = [];
  const log = (field: string, from: string | number, to: string | number, reason: string) => {
    if (from !== to) corrections.push({ field, from, to, reason });
  };
  if (params.pvMaterial === 'GaN' || params.pvMaterial === 'SiC') {
    const from = params.pvMaterial;
    params.pvMaterial = 'GaAs';
    log('pvMaterial', from, 'GaAs', 'Match Lumogen F Red 305');
  }
  if (params.dyeConcentrationPpm < BAND.dyeMin || params.dyeConcentrationPpm > BAND.dyeMax) {
    const from = params.dyeConcentrationPpm;
    params.dyeConcentrationPpm = 125;
    log('dyeConcentrationPpm', from, 125, 'Dye 100–150 ppm');
  }
  if (params.dyeDopant === 'None') {
    params.dyeDopant = 'Lumogen_Red_305';
    log('dyeDopant', 'None', 'Lumogen_Red_305', 'Restore LSC');
  }
  if (params.massFlowKgS < BAND.massFlowMin || params.massFlowKgS > BAND.massFlowMax) {
    const from = params.massFlowKgS;
    params.massFlowKgS = 0.13;
    log('massFlowKgS', from, 0.13, 'ṁ 0.12–0.15');
  }
  if (params.cavityGas === 'Air') {
    params.cavityGas = 'Argon';
    log('cavityGas', 'Air', 'Argon', 'U-factor');
  }
  if (params.lowEEmissivity > BAND.lowEMax) {
    const from = params.lowEEmissivity;
    params.lowEEmissivity = 0.03;
    log('lowEEmissivity', from, 0.03, 'ε ≤ 0.04');
  }
  if (params.barrierType === 'None') {
    params.barrierType = 'Multi_ALD_AlN_SiO2';
    log('barrierType', 'None', 'Multi_ALD_AlN_SiO2', 'WVTR');
  }
  if (params.thermalBreakWidthMm < 12) {
    const from = params.thermalBreakWidthMm;
    params.thermalBreakWidthMm = 18;
    log('thermalBreakWidthMm', from, 18, 'thermal break');
  }
  if (params.basePolymer !== 'Zeonex_150ppm') {
    const from = params.basePolymer;
    params.basePolymer = 'Zeonex_150ppm';
    log('basePolymer', from, 'Zeonex_150ppm', 'T_vis');
  }
  if (params.latticeGeometry !== 'Penrose_P3') {
    const from = params.latticeGeometry;
    params.latticeGeometry = 'Penrose_P3';
    log('latticeGeometry', from, 'Penrose_P3', 'flat-band');
  }
  if (params.inverterTopology !== 'Microinverter' && params.inverterTopology !== 'Buck_Boost_DC_DC') {
    const from = params.inverterTopology;
    params.inverterTopology = 'Buck_Boost_DC_DC';
    log('inverterTopology', from, 'Buck_Boost_DC_DC', 'NEC 690');
  }
  const clampNum = <K extends keyof typeof PARAM_BOUNDS>(key: K) => {
    const bound = PARAM_BOUNDS[key];
    const v = params[key] as number;
    const c = Math.min(bound.max, Math.max(bound.min, v));
    if (c !== v) {
      log(String(key), v, c, 'bounds');
      (params as DesignParams)[key] = c as DesignParams[K];
    }
  };
  (Object.keys(PARAM_BOUNDS) as (keyof typeof PARAM_BOUNDS)[]).forEach(clampNum);
  let metrics = computePhysics(params, Gsolar, Tamb);
  let guard = 0;
  while ((!metrics.nfrc100Pass || !metrics.nfrc200Pass || !metrics.dp105Capable) && guard < 10) {
    guard += 1;
    if (!metrics.nfrc100Pass) {
      params.massFlowKgS = Math.min(0.15, params.massFlowKgS + 0.01);
      params.lowEEmissivity = Math.max(0.02, params.lowEEmissivity - 0.005);
      if (params.cavityGas === 'Argon') params.cavityGas = 'Krypton';
      params.thermalBreakWidthMm = Math.min(30, params.thermalBreakWidthMm + 2);
    }
    if (!metrics.nfrc200Pass) {
      if (metrics.shgc > 0.4) params.dyeConcentrationPpm = Math.min(150, params.dyeConcentrationPpm + 10);
      else if (metrics.shgc < 0.2) params.dyeConcentrationPpm = Math.max(100, params.dyeConcentrationPpm - 10);
    }
    if (!metrics.dp105Capable) {
      params.adhesiveModulusGPa = Math.min(2.0, Math.max(0.8, params.adhesiveModulusGPa));
      params.substrateThicknessMm = Math.min(6, Math.max(3.5, params.substrateThicknessMm));
    }
    metrics = computePhysics(params, Gsolar, Tamb);
  }
  return {
    params, metrics, corrections,
    allPassing: metrics.nfrc100Pass && metrics.nfrc200Pass && metrics.dp105Capable && metrics.nec690Pass,
  };
}

export function clampToCompliantBand(params: DesignParams): DesignParams {
  const next = { ...params };
  if (next.pvMaterial === 'GaN' || next.pvMaterial === 'SiC') next.pvMaterial = 'GaAs';
  next.dyeConcentrationPpm = Math.min(BAND.dyeMax, Math.max(BAND.dyeMin, next.dyeConcentrationPpm));
  next.massFlowKgS = Math.min(BAND.massFlowMax, Math.max(BAND.massFlowMin, next.massFlowKgS));
  next.lowEEmissivity = Math.min(BAND.lowEMax, next.lowEEmissivity);
  if (next.cavityGas === 'Air') next.cavityGas = 'Argon';
  if (next.dyeDopant === 'None') next.dyeDopant = 'Lumogen_Red_305';
  if (next.barrierType === 'None') next.barrierType = 'Multi_ALD_AlN_SiO2';
  if (next.inverterTopology !== 'Microinverter' && next.inverterTopology !== 'Buck_Boost_DC_DC') {
    next.inverterTopology = 'Buck_Boost_DC_DC';
  }
  return next;
}

export function getCompliantDefaults(): DesignParams {
  return autoCorrectParameters({ ...DEFAULT_PARAMS }).params;
}

export type OptimizeMode = 'pareto_roi' | 'max_performance' | 'budget_cap' | 'exhaustive';

export interface SweepProgress {
  stateCount: number; evaluated: number; target: number; energy: number;
  temperature: number; bestFitness: number; running: boolean; message: string;
}

export interface ParetoCandidate {
  rank: number; result: DynamicStackResult; paybackYears: number; roiScore: number;
}

export interface SweepOptions {
  mode: OptimizeMode; budgetCapUsd: number; targetStates: number;
  onProgress?: (p: SweepProgress) => void;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bitsToConfig(bits: number[]): DynamicStackConfig {
  const layerCount = SWEEP_LAYERS[bits[0] % SWEEP_LAYERS.length];
  const substrate = SWEEP_SUBSTRATES[bits[1] % SWEEP_SUBSTRATES.length];
  const interlayer = SWEEP_INTERLAYERS[bits[2] % SWEEP_INTERLAYERS.length];
  const coating = SWEEP_COATINGS[bits[3] % SWEEP_COATINGS.length];
  const cavityGas = SWEEP_GASES[bits[4] % SWEEP_GASES.length];
  const edgePv = SWEEP_PV[bits[5] % SWEEP_PV.length];
  const coreThicknessMm = 3 + (bits[6] % 5) * 0.5;
  const lowEEmissivity = coating === 'LowE' || coating === 'ALD_AlN_SiO2' ? 0.03 : 0.15;
  return {
    layerCount, substrate, coreThicknessMm,
    interlayer: layerCount === 3 ? 'None' : interlayer,
    coating, cavityGas, edgePv, lowEEmissivity,
    includeHydronic: bits[7] % 2 === 0,
    thermalBreakMm: 12 + (bits[8] % 4) * 3,
  };
}

export function quboEnergy(r: DynamicStackResult, mode: OptimizeMode, budgetCap: number): number {
  let H = 0;
  H += r.uFactor > 0.85 ? 12 * (r.uFactor - 0.85) : -2 * (0.85 - r.uFactor);
  H += r.shgc < 0.2 || r.shgc > 0.4 ? 8 : -1;
  H += r.dp105Pass ? -3 : 15;
  H += r.etaEl < 5 ? 5 : -r.etaEl * 0.15;
  H += r.etaTh < 30 ? 4 : -r.etaTh * 0.08;
  H += r.bomCostUsd * 0.004;
  if (mode === 'budget_cap' && r.bomCostUsd > budgetCap) H += 20 + (r.bomCostUsd - budgetCap) * 0.05;
  if (mode === 'max_performance') {
    H -= r.powerWm2 * 0.02;
    H -= (1 / Math.max(0.4, r.uFactor)) * 5;
  }
  H -= ((r.etaEl * r.etaTh) / Math.max(1, r.bomCostUsd / 100)) * 0.5;
  return H;
}

export class QuantumInspiredSolver {
  private rng: () => number;
  constructor(seed = 42) { this.rng = mulberry32(seed); }
  annealStep(bits: number[], temperature: number): number[] {
    const next = bits.slice();
    const nFlips = 1 + Math.floor(this.rng() * 3);
    for (let f = 0; f < nFlips; f++) {
      const i = Math.floor(this.rng() * next.length);
      if (this.rng() < Math.min(1, 0.3 + temperature / 2)) {
        next[i] = (next[i] + 1 + Math.floor(this.rng() * 3)) % 8;
      }
    }
    return next;
  }
  randomBits(n = 12): number[] {
    return Array.from({ length: n }, () => Math.floor(this.rng() * 8));
  }
  rand(): number { return this.rng(); }
}

export function runQuantumParetoSweep(options: SweepOptions): {
  candidates: ParetoCandidate[]; evaluated: number; elapsedMs: number;
} {
  const { mode, budgetCapUsd, targetStates, onProgress } = options;
  const solver = new QuantumInspiredSolver(Date.now() % 1e6);
  const start = performance.now();
  const seen = new Set<string>();
  const results: DynamicStackResult[] = [];
  let bestFitness = -Infinity;
  let bestEnergy = Infinity;
  let temperature = 2.5;
  let bits = solver.randomBits(12);
  let evaluated = 0;
  const target = Math.max(500, Math.min(10000, targetStates));
  const chunk = 250;
  while (evaluated < target) {
    for (let i = 0; i < chunk && evaluated < target; i++) {
      bits = solver.annealStep(bits, temperature);
      if (solver.rand() < 0.08) bits = solver.randomBits(12);
      const config = bitsToConfig(bits);
      const key = [config.layerCount, config.substrate, config.interlayer, config.coating, config.cavityGas, config.edgePv, config.coreThicknessMm, config.includeHydronic].join('|');
      if (seen.has(key)) { evaluated += 1; continue; }
      seen.add(key);
      const result = buildDynamicStack(config);
      const E = quboEnergy(result, mode, budgetCapUsd);
      evaluated += 1;
      if (E < bestEnergy) bestEnergy = E;
      if (result.fitness > bestFitness) bestFitness = result.fitness;
      const compliant = result.uFactor <= 0.95 && result.dp105Pass && (mode !== 'budget_cap' || result.bomCostUsd <= budgetCapUsd * 1.05);
      if (compliant || mode === 'exhaustive' || mode === 'max_performance') results.push(result);
    }
    temperature = Math.max(0.05, temperature * 0.92);
    onProgress?.({
      stateCount: seen.size, evaluated, target,
      energy: Math.round(bestEnergy * 1000) / 1000,
      temperature: Math.round(temperature * 1000) / 1000,
      bestFitness: Math.round(bestFitness * 100) / 100,
      running: evaluated < target,
      message: `SQA T=${temperature.toFixed(2)} · E(q)=${bestEnergy.toFixed(2)} · ${evaluated}/${target}`,
    });
  }
  let ranked = results.slice();
  if (mode === 'pareto_roi' || mode === 'exhaustive') ranked.sort((a, b) => b.fitness - a.fitness);
  else if (mode === 'max_performance') ranked.sort((a, b) => b.powerWm2 / Math.max(0.4, b.uFactor) - a.powerWm2 / Math.max(0.4, a.uFactor));
  else if (mode === 'budget_cap') {
    ranked = ranked.filter((r) => r.bomCostUsd <= budgetCapUsd);
    ranked.sort((a, b) => b.fitness - a.fitness);
  }
  const bestByLabel = new Map<string, DynamicStackResult>();
  for (const r of ranked) {
    const prev = bestByLabel.get(r.label);
    if (!prev || r.fitness > prev.fitness) bestByLabel.set(r.label, r);
  }
  ranked = Array.from(bestByLabel.values()).sort((a, b) => b.fitness - a.fitness);
  const candidates: ParetoCandidate[] = ranked.slice(0, 12).map((r, i) => {
    const annualKwh = (r.powerWm2 * PROTOTYPE_AREA_M2 * 1200) / 1000;
    const valuePerYear = annualKwh * 0.14;
    const paybackYears = valuePerYear > 0 ? Math.round((r.bomCostUsd / valuePerYear) * 10) / 10 : 99;
    return { rank: i + 1, result: r, paybackYears, roiScore: r.fitness };
  });
  onProgress?.({
    stateCount: seen.size, evaluated, target,
    energy: Math.round(bestEnergy * 1000) / 1000,
    temperature: Math.round(temperature * 1000) / 1000,
    bestFitness: Math.round(bestFitness * 100) / 100,
    running: false,
    message: `Complete · ${candidates.length} Pareto candidates from ${evaluated} states`,
  });
  return { candidates, evaluated, elapsedMs: Math.round(performance.now() - start) };
}

const PROTOTYPE_AREA_M2 = 1.393;

export function stackConfigToParams(cfg: DynamicStackConfig, base: DesignParams): DesignParams {
  const polymerMap: Record<SubstrateMat, DesignParams['basePolymer']> = {
    Zeonex: 'Zeonex_150ppm', PMMA: 'PMMA', Polycarbonate: 'Polycarbonate', LowIronGlass: 'Glass',
  };
  const barrierMap: Record<CoatingMat, DesignParams['barrierType']> = {
    ALD_AlN_SiO2: 'Multi_ALD_AlN_SiO2', LowE: 'Single_Layer_ALD_AlN', Fluoropolymer: 'None', None: 'None',
  };
  return {
    ...base,
    basePolymer: polymerMap[cfg.substrate],
    substrateThicknessMm: cfg.coreThicknessMm,
    pvMaterial: cfg.edgePv === 'GaAs' ? 'GaAs' : 'c-Si',
    cavityGas: cfg.cavityGas,
    lowEEmissivity: cfg.lowEEmissivity,
    barrierType: barrierMap[cfg.coating],
    thermalBreakWidthMm: cfg.thermalBreakMm,
    massFlowKgS: cfg.includeHydronic ? 0.13 : 0.05,
    surfaceCoating: cfg.coating === 'Fluoropolymer' ? 'Fluoropolymer' : base.surfaceCoating,
  };
}

// ─── Inverse generative design ──────────────────────────────────────────────

export interface InverseTargetSpecs {
  targetCostPerSqFt: number;
  targetPowerWm2: number;
  targetUFactor: number;
  targetDpRating: number;
}

export interface InverseDesignResult {
  targets: InverseTargetSpecs;
  stack: DynamicStackResult;
  params: DesignParams;
  achieved: { costPerSqFt: number; powerWm2: number; uFactor: number; dpRating: number };
  residuals: { cost: number; power: number; uFactor: number; dp: number };
  score: number;
  message: string;
  iterations: number;
}

export function inverseDesignSolve(
  targets: InverseTargetSpecs,
  base: DesignParams,
  maxIters = 6000,
): InverseDesignResult {
  const solver = new QuantumInspiredSolver((Date.now() % 1e6) + 7);
  let bits = solver.randomBits(12);
  let best: DynamicStackResult | null = null;
  let bestScore = Infinity;
  let bestParams = base;
  let iterations = 0;
  let temperature = 3.0;
  const areaSqFt = 15;

  const scoreOf = (r: DynamicStackResult): number => {
    const costPsf = r.bomCostUsd / areaSqFt;
    const dpAchieved = r.dp105Pass ? 105 : r.sigmaMaxMPa < 60 ? 70 : 50;
    const rc = Math.abs(costPsf - targets.targetCostPerSqFt) / Math.max(20, targets.targetCostPerSqFt);
    const rp = Math.abs(r.powerWm2 - targets.targetPowerWm2) / Math.max(20, targets.targetPowerWm2);
    const ru = Math.abs(r.uFactor - targets.targetUFactor) / Math.max(0.3, targets.targetUFactor);
    const rd = Math.abs(dpAchieved - targets.targetDpRating) / 105;
    const bias =
      (costPsf > targets.targetCostPerSqFt ? 0.3 : -0.05) * rc +
      (r.powerWm2 < targets.targetPowerWm2 ? 0.25 : -0.05) * rp;
    return rc * 2.0 + rp * 2.5 + ru * 2.0 + rd * 1.5 + bias;
  };

  while (iterations < maxIters) {
    bits = solver.annealStep(bits, temperature);
    if (solver.rand() < 0.1) bits = solver.randomBits(12);
    if (targets.targetUFactor < 0.7 && solver.rand() < 0.3) bits[0] = 3 + Math.floor(solver.rand() * 2);
    if (targets.targetCostPerSqFt < 80 && solver.rand() < 0.3) bits[0] = Math.floor(solver.rand() * 2);

    const layerCount = SWEEP_LAYERS[bits[0] % SWEEP_LAYERS.length];
    const substrate = SWEEP_SUBSTRATES[bits[1] % SWEEP_SUBSTRATES.length];
    const interlayer = SWEEP_INTERLAYERS[bits[2] % SWEEP_INTERLAYERS.length];
    const coating0 = SWEEP_COATINGS[bits[3] % SWEEP_COATINGS.length];
    const cavityGas0 = SWEEP_GASES[bits[4] % SWEEP_GASES.length];
    const edgePv0 = SWEEP_PV[bits[5] % SWEEP_PV.length];
    const pv = targets.targetPowerWm2 > 60 ? 'GaAs' : edgePv0;
    const gas = targets.targetUFactor < 0.75 ? (solver.rand() < 0.6 ? 'Krypton' : 'Argon') : cavityGas0;
    const coat = targets.targetUFactor < 0.8 ? (solver.rand() < 0.5 ? 'ALD_AlN_SiO2' : 'LowE') : coating0;
    const config = {
      layerCount,
      substrate,
      coreThicknessMm: 3 + (bits[6] % 5) * 0.5,
      interlayer: layerCount === 3 ? ('None' as const) : interlayer,
      coating: coat as typeof coating0,
      cavityGas: gas as typeof cavityGas0,
      edgePv: pv as typeof edgePv0,
      lowEEmissivity: coat === 'LowE' || coat === 'ALD_AlN_SiO2' ? 0.03 : 0.15,
      includeHydronic: targets.targetPowerWm2 < 40 ? false : bits[7] % 2 === 0,
      thermalBreakMm: targets.targetUFactor < 0.7 ? 18 + (bits[8] % 3) * 3 : 12 + (bits[8] % 3) * 3,
    };

    const result = buildDynamicStack(config);
    const s = scoreOf(result);
    iterations += 1;
    if (s < bestScore) {
      bestScore = s;
      best = result;
      bestParams = stackConfigToParams(result.config, base);
      if (result.powerWm2 < targets.targetPowerWm2) {
        bestParams.dyeConcentrationPpm = Math.min(150, 135);
        bestParams.pvMaterial = 'GaAs';
      }
      if (result.uFactor > targets.targetUFactor) {
        bestParams.lowEEmissivity = 0.03;
        bestParams.cavityGas = 'Krypton';
        bestParams.massFlowKgS = 0.13;
      }
    }
    temperature = Math.max(0.04, temperature * 0.97);
    if (bestScore < 0.15) break;
  }

  if (!best) {
    const fallback = buildDynamicStack({
      layerCount: 7, substrate: 'Zeonex', coreThicknessMm: 4, interlayer: 'OCA',
      coating: 'ALD_AlN_SiO2', cavityGas: 'Argon', edgePv: 'GaAs',
      lowEEmissivity: 0.03, includeHydronic: true, thermalBreakMm: 18,
    });
    best = fallback;
    bestParams = stackConfigToParams(fallback.config, base);
  }

  const costPsf = best.bomCostUsd / areaSqFt;
  const dpAchieved = best.dp105Pass ? 105 : best.sigmaMaxMPa < 60 ? 70 : 50;
  const residuals = {
    cost: Math.round((costPsf - targets.targetCostPerSqFt) * 100) / 100,
    power: Math.round((best.powerWm2 - targets.targetPowerWm2) * 10) / 10,
    uFactor: Math.round((best.uFactor - targets.targetUFactor) * 1000) / 1000,
    dp: dpAchieved - targets.targetDpRating,
  };
  const ok =
    Math.abs(residuals.cost) / Math.max(20, targets.targetCostPerSqFt) < 0.35 &&
    Math.abs(residuals.power) / Math.max(20, targets.targetPowerWm2) < 0.35 &&
    Math.abs(residuals.uFactor) < 0.25;

  return {
    targets, stack: best, params: bestParams,
    achieved: {
      costPerSqFt: Math.round(costPsf * 100) / 100,
      powerWm2: best.powerWm2,
      uFactor: best.uFactor,
      dpRating: dpAchieved,
    },
    residuals,
    score: Math.round(bestScore * 1000) / 1000,
    message: ok
      ? `Inverse design converged (${iterations} iters) → ${best.label}`
      : `Best effort after ${iterations} iters → ${best.label} (residuals remain)`,
    iterations,
  };
}
