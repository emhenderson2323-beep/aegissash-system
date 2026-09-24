/**
 * Topological sensitivity & Monte Carlo stress tester
 * 1,000-point edge-case validation across thermal, structural, hydronic, financial axes
 */

export interface StressTestInputs {
  baseUFactor: number;
  baseShgc: number;
  baseNetPowerWm2: number;
  baseTauMaxKPa: number;
  tauYieldKPa: number;
  frameCteMatchPct: number;
  year1ElectricKwh: number;
  year1ThermalKwh: number;
  systemCapEx: number;
  retailRate: number;
  selfConsumptionRatio: number;
  annualEscalationPct: number;
  degradationPct: number;
  areaM2: number;
}

export interface PercentileStats {
  p50: number;
  p90: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
}

export interface StressTestResult {
  iterations: number;
  elapsedMs: number;
  shearFailureRiskPct: number;
  thermalShockRiskPct: number;
  paybackYears: PercentileStats;
  cumulative25ySavings: PercentileStats;
  sealIntegrityScore: PercentileStats;
  structuralPassRatePct: number;
  financialPassRatePct: number;
  worstCaseSummary: string;
  gauges: {
    interfacialShear: number;
    thermalShock: number;
    paybackVariance: number;
  };
}

function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function percentiles(sorted: number[]): PercentileStats {
  if (sorted.length === 0) {
    return { p50: 0, p90: 0, p99: 0, mean: 0, min: 0, max: 0 };
  }
  const at = (p: number) => {
    const i = (sorted.length - 1) * p;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
  };
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: at(0.5),
    p90: at(0.9),
    p99: at(0.99),
    mean: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

export function runMonteCarloStressTest(
  inputs: StressTestInputs,
  iterations = 1000,
): StressTestResult {
  const t0 =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  let shearFails = 0;
  let thermalFails = 0;
  let structuralPass = 0;
  let financialPass = 0;

  const paybacks: number[] = [];
  const savings25: number[] = [];
  const sealScores: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const tCold = -40 + Math.random() * 5;
    const tHot = 40 + Math.random() * 15;
    const deltaT = tHot - tCold;

    const tauScatter = 1 + 0.15 * randn();
    const tau = Math.max(10, inputs.baseTauMaxKPa * tauScatter * (deltaT / 80));
    const shearFail = tau > inputs.tauYieldKPa * (0.85 + 0.1 * Math.random());
    if (shearFail) shearFails++;

    const cteWeak = 1 - inputs.frameCteMatchPct / 100;
    const shockIndex = (deltaT / 100) * (1 + cteWeak) * (inputs.baseUFactor / 0.7);
    if (shockIndex > 1.4) thermalFails++;

    const dpKPa = 1.44 + Math.random() * (5.02 - 1.44);
    const structuralOk =
      !shearFail && shockIndex < 1.6 && dpKPa <= 5.02 * (1.05 - 0.1 * cteWeak);
    if (structuralOk) structuralPass++;

    const seal =
      100 -
      clamp(tau / Math.max(1, inputs.tauYieldKPa), 0, 1.5) * 40 -
      clamp(shockIndex - 0.8, 0, 1) * 35 -
      (shearFail ? 25 : 0);
    sealScores.push(clamp(seal, 0, 100));

    const flowLoss = Math.random();
    const powerDerate = 1 - 0.35 * flowLoss;
    const elecDerate = 1 - 0.05 * flowLoss;

    const rateShock = 1 + 0.4 * randn() * 0.5;
    const rate = Math.max(0.05, inputs.retailRate * rateShock);
    const deg = inputs.degradationPct / 100;

    let cum = -inputs.systemCapEx;
    let payback = 30;
    let paybackFound = false;
    let prev = cum;
    for (let y = 1; y <= 25; y++) {
      const genE =
        inputs.year1ElectricKwh *
        Math.pow(1 - deg, y - 1) *
        elecDerate *
        (0.92 + 0.08 * Math.random());
      const genT =
        inputs.year1ThermalKwh *
        Math.pow(1 - deg, y - 1) *
        powerDerate *
        (0.9 + 0.1 * Math.random());
      const yrRate = rate * Math.pow(1 + inputs.annualEscalationPct / 100, y - 1);
      const self = (inputs.selfConsumptionRatio / 100) * genE * yrRate;
      const exp = (1 - inputs.selfConsumptionRatio / 100) * genE * yrRate * 0.9;
      const th = genT * 0.12 * Math.pow(1 + inputs.annualEscalationPct / 100, y - 1);
      const sav = self + exp + th;
      prev = cum;
      cum += sav;
      if (!paybackFound && cum >= 0) {
        payback = y - 1 + Math.abs(prev) / Math.max(1e-6, sav);
        paybackFound = true;
      }
    }
    paybacks.push(payback);
    savings25.push(cum);
    if (payback < 15) financialPass++;
  }

  paybacks.sort((a, b) => a - b);
  savings25.sort((a, b) => a - b);
  sealScores.sort((a, b) => a - b);

  const pb = percentiles(paybacks);
  const sv = percentiles(savings25);
  const seal = percentiles(sealScores);

  const shearRisk = (shearFails / iterations) * 100;
  const thermalRisk = (thermalFails / iterations) * 100;
  const meanPb = pb.mean;
  const stdPb = Math.sqrt(
    paybacks.reduce((s, x) => s + (x - meanPb) * (x - meanPb), 0) / iterations,
  );
  const cv = meanPb > 0 ? (stdPb / meanPb) * 100 : 0;

  const t1 =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const worst: string[] = [];
  if (shearRisk > 15) worst.push('Elevated shear fail rate ' + shearRisk.toFixed(1) + '%');
  if (thermalRisk > 20) worst.push('Thermal shock flags ' + thermalRisk.toFixed(1) + '%');
  if (pb.p90 > 12) worst.push('P90 payback ' + pb.p90.toFixed(1) + ' yr');
  const sealP10 = sealScores[Math.floor((sealScores.length - 1) * 0.1)] ?? seal.min;
  if (sealP10 < 55) worst.push('Seal integrity P10 ' + sealP10.toFixed(0) + '/100');

  return {
    iterations,
    elapsedMs: Math.round(t1 - t0),
    shearFailureRiskPct: Math.round(shearRisk * 10) / 10,
    thermalShockRiskPct: Math.round(thermalRisk * 10) / 10,
    paybackYears: {
      p50: Math.round(pb.p50 * 10) / 10,
      p90: Math.round(pb.p90 * 10) / 10,
      p99: Math.round(pb.p99 * 10) / 10,
      mean: Math.round(pb.mean * 10) / 10,
      min: Math.round(pb.min * 10) / 10,
      max: Math.round(pb.max * 10) / 10,
    },
    cumulative25ySavings: {
      p50: Math.round(sv.p50),
      p90: Math.round(sv.p90),
      p99: Math.round(sv.p99),
      mean: Math.round(sv.mean),
      min: Math.round(sv.min),
      max: Math.round(sv.max),
    },
    sealIntegrityScore: {
      p50: Math.round(seal.p50 * 10) / 10,
      p90: Math.round(seal.p90 * 10) / 10,
      p99: Math.round(seal.p99 * 10) / 10,
      mean: Math.round(seal.mean * 10) / 10,
      min: Math.round(seal.min * 10) / 10,
      max: Math.round(seal.max * 10) / 10,
    },
    structuralPassRatePct: Math.round((structuralPass / iterations) * 1000) / 10,
    financialPassRatePct: Math.round((financialPass / iterations) * 1000) / 10,
    worstCaseSummary:
      worst.length > 0 ? worst.join(' · ') : 'No critical edge-case concentrations detected',
    gauges: {
      interfacialShear: Math.round(clamp(shearRisk, 0, 100)),
      thermalShock: Math.round(clamp(thermalRisk, 0, 100)),
      paybackVariance: Math.round(clamp(cv, 0, 100)),
    },
  };
}
