/**
 * Unconstrained multi-material frame optimizer
 * Evaluates all library materials + generative blend for cost / U / CTE / DP
 */

export interface FrameMaterialSpec {
  id: string;
  name: string;
  category: 'standard' | 'generative';
  costPerLinearFt: number;
  kWmK: number;
  ctePerK: number;
  flexuralModulusGPa: number;
  densityKgM3: number;
  notes: string;
}

export const GLASS_CTE = 8.5e-6;

export const FRAME_MATERIAL_LIBRARY: FrameMaterialSpec[] = [
  {
    id: 'frp',
    name: 'Pultruded Structural Fiberglass (FRP)',
    category: 'standard',
    costPerLinearFt: 18,
    kWmK: 0.25,
    ctePerK: 10e-6,
    flexuralModulusGPa: 25,
    densityKgM3: 1850,
    notes: 'Low k, good CTE match to glass, corrosion-proof',
  },
  {
    id: 'tb_alu',
    name: 'Thermally Broken Extruded Aluminum (6063-T6)',
    category: 'standard',
    costPerLinearFt: 22,
    kWmK: 1.8,
    ctePerK: 23e-6,
    flexuralModulusGPa: 69,
    densityKgM3: 2700,
    notes: 'High strength; thermal break required; higher CTE',
  },
  {
    id: 'pvc_cf',
    name: 'Carbon-Fiber Reinforced Structural Vinyl (PVC-CF)',
    category: 'standard',
    costPerLinearFt: 14,
    kWmK: 0.18,
    ctePerK: 35e-6,
    flexuralModulusGPa: 8,
    densityKgM3: 1400,
    notes: 'Affordable; moderate stiffness; higher CTE',
  },
  {
    id: 'wpc',
    name: 'Wood-Plastic Structural Composite (WPC)',
    category: 'standard',
    costPerLinearFt: 12,
    kWmK: 0.22,
    ctePerK: 28e-6,
    flexuralModulusGPa: 6,
    densityKgM3: 1100,
    notes: 'Lowest cost class; limited DP for large spans',
  },
  {
    id: 'cellular_pvc',
    name: 'High-Density Structural Cellular PVC',
    category: 'standard',
    costPerLinearFt: 11,
    kWmK: 0.15,
    ctePerK: 45e-6,
    flexuralModulusGPa: 3.5,
    densityKgM3: 650,
    notes: 'Excellent insulation; softest structurally',
  },
  {
    id: 'ss_cw',
    name: 'Thin-Wall Stainless Steel (Curtain Wall Grade)',
    category: 'standard',
    costPerLinearFt: 45,
    kWmK: 12,
    ctePerK: 17e-6,
    flexuralModulusGPa: 193,
    densityKgM3: 8000,
    notes: 'Premium stiffness; high k unless thermally broken',
  },
];

export interface FrameOptimizeTargets {
  targetCostPerSqFt: number;
  targetUFactor: number;
  targetDpRating: number;
  climateDeltaT: number;
  panelWidthM: number;
  panelHeightM: number;
  areaSqFt: number;
  glassStackCostUsd: number;
  forcedMaterialId: string | null;
}

export interface FrameCandidateScore {
  material: FrameMaterialSpec;
  perimeterFt: number;
  frameCostUsd: number;
  totalCostPerSqFt: number;
  frameContributionU: number;
  estimatedSystemU: number;
  tauMaxKPa: number;
  cteMatchScore: number;
  dpRating: number;
  structuralScore: number;
  qualityScore: number;
  costScore: number;
  overallScore: number;
  rank: number;
  selected: boolean;
  rationale: string;
}

export interface FrameOptimizeResult {
  mode: 'auto' | 'manual';
  selected: FrameCandidateScore;
  ranking: FrameCandidateScore[];
  generative: FrameMaterialSpec | null;
}

function perimeterFt(wM: number, hM: number): number {
  return 2 * (wM + hM) * 3.28084;
}

function frameUContribution(k: number, breakMm: number): number {
  const Rframe = breakMm / 1000 / Math.max(0.05, k) + 0.05;
  return 1 / (Rframe + 0.2);
}

function tauFromCte(frameCte: number, deltaT: number): number {
  const dAlpha = Math.abs(frameCte - GLASS_CTE);
  const strain = dAlpha * Math.abs(deltaT);
  return Math.round(strain * 8e6 * 0.012 * 10) / 10;
}

function dpFromModulus(E: number): number {
  if (E >= 20) return 105;
  if (E >= 8) return 70;
  if (E >= 5) return 50;
  return 30;
}

export function synthesizeGenerativeBlend(targets: FrameOptimizeTargets): FrameMaterialSpec {
  const targetK = Math.max(0.12, Math.min(0.4, targets.targetUFactor * 0.35));
  const targetCte = GLASS_CTE * 1.15;
  const targetE =
    targets.targetDpRating >= 105 ? 22 : targets.targetDpRating >= 70 ? 12 : 6;
  const residualBudget =
    targets.targetCostPerSqFt * targets.areaSqFt - targets.glassStackCostUsd;
  const peri = perimeterFt(targets.panelWidthM, targets.panelHeightM);
  const costFt = Math.max(8, Math.min(40, residualBudget / Math.max(1, peri)));
  return {
    id: 'generative',
    name: 'Generative Synthetic Blend (procedural)',
    category: 'generative',
    costPerLinearFt: Math.round(costFt * 100) / 100,
    kWmK: Math.round(targetK * 1000) / 1000,
    ctePerK: targetCte,
    flexuralModulusGPa: targetE,
    densityKgM3: 1200,
    notes: `Auto-synthesized for U≤${targets.targetUFactor}, DP${targets.targetDpRating}, budget residual $${residualBudget.toFixed(0)}`,
  };
}

export function optimizeFrameMaterial(targets: FrameOptimizeTargets): FrameOptimizeResult {
  const peri = perimeterFt(targets.panelWidthM, targets.panelHeightM);
  const breakMm = 18;
  const baseU = Math.max(0.45, targets.targetUFactor * 0.85);

  const generative = synthesizeGenerativeBlend(targets);
  const library: FrameMaterialSpec[] = [...FRAME_MATERIAL_LIBRARY, generative];

  const scored: FrameCandidateScore[] = library.map((mat) => {
    const frameCostUsd = mat.costPerLinearFt * peri;
    const totalCost = targets.glassStackCostUsd + frameCostUsd;
    const totalCostPerSqFt = totalCost / Math.max(0.1, targets.areaSqFt);
    const frameU = frameUContribution(mat.kWmK, breakMm);
    const estimatedSystemU = Math.min(2.5, baseU + frameU * 0.15);
    const tauMaxKPa = tauFromCte(mat.ctePerK, targets.climateDeltaT);
    const cteMatchScore = Math.max(0, 1 - Math.abs(mat.ctePerK - GLASS_CTE) / 50e-6);
    const dpRating = dpFromModulus(mat.flexuralModulusGPa);
    const structuralScore = Math.min(100, (mat.flexuralModulusGPa / 70) * 100);
    const uScore = Math.max(0, 100 - (estimatedSystemU - 0.4) * 80);
    const dpScore =
      dpRating >= targets.targetDpRating
        ? 100
        : (dpRating / Math.max(1, targets.targetDpRating)) * 70;
    const qualityScore =
      0.35 * uScore + 0.25 * cteMatchScore * 100 + 0.25 * dpScore + 0.15 * structuralScore;
    const over = Math.max(0, totalCostPerSqFt - targets.targetCostPerSqFt);
    const costScore = Math.max(0, 100 - over * 2 - totalCostPerSqFt * 0.15);
    const overallScore = 0.55 * qualityScore + 0.45 * costScore;

    const rationaleParts: string[] = [];
    if (estimatedSystemU <= targets.targetUFactor) rationaleParts.push('U target met');
    else rationaleParts.push('U above target');
    if (dpRating >= targets.targetDpRating) rationaleParts.push(`DP${dpRating}`);
    else rationaleParts.push(`DP${dpRating} short`);
    if (cteMatchScore > 0.7) rationaleParts.push('CTE match good');
    rationaleParts.push(`$${mat.costPerLinearFt}/ft`);

    return {
      material: mat,
      perimeterFt: Math.round(peri * 10) / 10,
      frameCostUsd: Math.round(frameCostUsd),
      totalCostPerSqFt: Math.round(totalCostPerSqFt * 100) / 100,
      frameContributionU: Math.round(frameU * 1000) / 1000,
      estimatedSystemU: Math.round(estimatedSystemU * 1000) / 1000,
      tauMaxKPa,
      cteMatchScore: Math.round(cteMatchScore * 1000) / 1000,
      dpRating,
      structuralScore: Math.round(structuralScore),
      qualityScore: Math.round(qualityScore * 10) / 10,
      costScore: Math.round(costScore * 10) / 10,
      overallScore: Math.round(overallScore * 10) / 10,
      rank: 0,
      selected: false,
      rationale: rationaleParts.join(' · '),
    };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  let selected: FrameCandidateScore;
  if (targets.forcedMaterialId) {
    const forced =
      scored.find((s) => s.material.id === targets.forcedMaterialId) ?? scored[0];
    selected = { ...forced, selected: true };
  } else {
    selected = { ...scored[0], selected: true };
  }

  const ranking = scored.map((s) =>
    s.material.id === selected.material.id ? { ...s, selected: true } : s,
  );

  return {
    mode: targets.forcedMaterialId ? 'manual' : 'auto',
    selected,
    ranking,
    generative,
  };
}
