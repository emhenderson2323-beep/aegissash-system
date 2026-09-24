/**
 * AegisSash auto-optimization / constraint solver
 * Forces the 22-parameter design vector into NFRC 100/200 + DP105 compliant ranges.
 */

import {
  DesignParams,
  DEFAULT_PARAMS,
  computePhysics,
  PhysicsMetrics,
} from '../lib/engine';

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

const TARGET = {
  massFlowMin: 0.12,
  massFlowMax: 0.15,
  dyeMin: 100,
  dyeMax: 150,
  lowEMax: 0.04,
  uMax: 0.85,
  shgcMin: 0.2,
  shgcMax: 0.4,
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
    log('pvMaterial', from, 'GaAs', 'Match Lumogen F Red 305 / InP QD emission (~620 nm)');
  }

  if (params.dyeConcentrationPpm < TARGET.dyeMin || params.dyeConcentrationPpm > TARGET.dyeMax) {
    const from = params.dyeConcentrationPpm;
    params.dyeConcentrationPpm = 125;
    log('dyeConcentrationPpm', from, 125, 'Rebalance dye 100–150 ppm to limit self-absorption');
  }
  if (params.dyeDopant === 'None') {
    params.dyeDopant = 'Lumogen_Red_305';
    log('dyeDopant', 'None', 'Lumogen_Red_305', 'Restore LSC donor for FRET cascade');
  }

  if (params.massFlowKgS < TARGET.massFlowMin || params.massFlowKgS > TARGET.massFlowMax) {
    const from = params.massFlowKgS;
    params.massFlowKgS = 0.13;
    log('massFlowKgS', from, 0.13, 'Tune ṁ to 0.12–0.15 kg/s thermal boundary');
  }

  if (params.cavityGas === 'Air' || !params.cavityGas) {
    const from = params.cavityGas ?? 'Air';
    params.cavityGas = 'Argon';
    log('cavityGas', from, 'Argon', 'Enforce Argon cavity fill for NFRC 100 U-factor');
  }
  if (params.lowEEmissivity > TARGET.lowEMax) {
    const from = params.lowEEmissivity;
    params.lowEEmissivity = 0.03;
    log('lowEEmissivity', from, 0.03, 'Low-E emissivity ≤ 0.04');
  }

  if (params.barrierType === 'None') {
    params.barrierType = 'Multi_ALD_AlN_SiO2';
    log('barrierType', 'None', 'Multi_ALD_AlN_SiO2', 'Hermetic ALD barrier required');
  }

  if (params.thermalBreakWidthMm < 12) {
    const from = params.thermalBreakWidthMm;
    params.thermalBreakWidthMm = 18;
    log('thermalBreakWidthMm', from, 18, 'Widen thermal break for frame U contribution');
  }

  if (params.basePolymer !== 'Zeonex_150ppm') {
    const from = params.basePolymer;
    params.basePolymer = 'Zeonex_150ppm';
    log('basePolymer', from, 'Zeonex_150ppm', 'High-T_vis low-E core polymer');
  }
  if (params.latticeGeometry !== 'Penrose_P3') {
    const from = params.latticeGeometry;
    params.latticeGeometry = 'Penrose_P3';
    log('latticeGeometry', from, 'Penrose_P3', 'Isotropic band-edge light trapping');
  }

  let metrics = computePhysics(params, Gsolar, Tamb);
  let guard = 0;
  while ((!metrics.nfrc100Pass || !metrics.nfrc200Pass || !metrics.dp105Capable) && guard < 8) {
    guard += 1;
    if (!metrics.nfrc100Pass) {
      params.massFlowKgS = Math.min(0.15, params.massFlowKgS + 0.01);
      params.lowEEmissivity = Math.max(0.02, params.lowEEmissivity - 0.005);
      if (params.cavityGas === 'Argon') params.cavityGas = 'Krypton';
      params.thermalBreakWidthMm = Math.min(30, params.thermalBreakWidthMm + 2);
      log('iter', guard, guard, `NFRC100 recovery pass ${guard}`);
    }
    if (!metrics.nfrc200Pass) {
      if (metrics.shgc > TARGET.shgcMax) {
        params.dyeConcentrationPpm = Math.min(150, params.dyeConcentrationPpm + 10);
      } else if (metrics.shgc < TARGET.shgcMin) {
        params.dyeConcentrationPpm = Math.max(100, params.dyeConcentrationPpm - 10);
      }
      log('dyeConcentrationPpm', 'adjust', params.dyeConcentrationPpm, 'SHGC band 0.20–0.40');
    }
    if (!metrics.dp105Capable) {
      params.adhesiveModulusGPa = Math.min(2.0, Math.max(0.8, params.adhesiveModulusGPa));
      params.substrateThicknessMm = Math.min(6, Math.max(3.5, params.substrateThicknessMm));
      log('structure', 'tune', 'NA/core', 'DP105 neutral-axis / stress recovery');
    }
    metrics = computePhysics(params, Gsolar, Tamb);
  }

  return {
    params,
    metrics,
    corrections,
    allPassing: metrics.nfrc100Pass && metrics.nfrc200Pass && metrics.dp105Capable,
  };
}

export function clampToCompliantBand(params: DesignParams): DesignParams {
  const next = { ...params };
  if (next.pvMaterial === 'GaN' || next.pvMaterial === 'SiC') next.pvMaterial = 'GaAs';
  next.dyeConcentrationPpm = Math.min(TARGET.dyeMax, Math.max(TARGET.dyeMin, next.dyeConcentrationPpm));
  next.massFlowKgS = Math.min(TARGET.massFlowMax, Math.max(TARGET.massFlowMin, next.massFlowKgS));
  next.lowEEmissivity = Math.min(TARGET.lowEMax, next.lowEEmissivity);
  if (next.cavityGas === 'Air') next.cavityGas = 'Argon';
  if (next.dyeDopant === 'None') next.dyeDopant = 'Lumogen_Red_305';
  if (next.barrierType === 'None') next.barrierType = 'Multi_ALD_AlN_SiO2';
  return next;
}

export function getCompliantDefaults(): DesignParams {
  return autoCorrectParameters({ ...DEFAULT_PARAMS }).params;
}
