/**
 * Physical manufacturing + dynamic N-layer stack + CSI submittal
 * Reference: 3'×5' prototype · Docket SOLASTRATA-PROV-2026-01
 * Product: Solastrata™ BIPV-T Active Glazing Systems
 */

export const PROTOTYPE = {
  widthIn: 36, heightIn: 60, widthM: 0.914, heightM: 1.524,
  areaM2: 1.393, areaSqFt: 15.0, label: '3′ × 5′ (36″ × 60″) prototype',
} as const;

export interface BomLine {
  id: string; category: string; component: string; tradeName: string;
  specification: string; qty: string; unitCostUsd: number; extendedUsd: number;
  supplier: string; notes?: string;
}

export function buildBom(): { lines: BomLine[]; totalUsd: number; costPerSqFt: number } {
  const lines: BomLine[] = [
    { id: 'g1', category: 'Glass', component: 'Outer lite', tradeName: 'Low-iron tempered float glass', specification: '36″ × 60″ × 2.0 mm', qty: '1 sheet', unitCostUsd: 85, extendedUsd: 85, supplier: 'Guardian / Vitro' },
    { id: 'g2', category: 'Glass', component: 'Inner lite', tradeName: 'Low-iron tempered float glass', specification: '36″ × 60″ × 2.0 mm', qty: '1 sheet', unitCostUsd: 85, extendedUsd: 85, supplier: 'Guardian / Vitro' },
    { id: 'p1', category: 'Polymer core', component: 'Optical waveguide core', tradeName: 'Zeonex 480R', specification: '36″ × 60″ × 4.0 mm', qty: '1 panel', unitCostUsd: 220, extendedUsd: 220, supplier: 'Zeon Corp' },
    { id: 'd1', category: 'Fluorophore', component: 'Organic dye', tradeName: 'Lumogen F Red 305', specification: '125–150 ppm', qty: '~0.8 g', unitCostUsd: 45, extendedUsd: 45, supplier: 'BASF / Sigma-Aldrich' },
    { id: 'qd1', category: 'Quantum dots', component: 'Core-shell QDs', tradeName: 'InP/ZnS', specification: 'd≈3.2 nm · ~450 ppm', qty: '~2.5 g', unitCostUsd: 180, extendedUsd: 180, supplier: 'NN-Labs / Sigma-Aldrich' },
    { id: 'a1', category: 'Adhesive', component: 'Upper OCA', tradeName: '3M 8146 OCA', specification: '0.5–1.0 mm (CTE-tuned)', qty: '1', unitCostUsd: 55, extendedUsd: 55, supplier: 'Ellsworth Adhesives' },
    { id: 'a2', category: 'Adhesive', component: 'Lower OCA', tradeName: '3M 8146 OCA', specification: '0.5–1.0 mm (CTE-tuned)', qty: '1', unitCostUsd: 55, extendedUsd: 55, supplier: 'Ellsworth Adhesives' },
    { id: 'b1', category: 'Barrier', component: 'ALD barrier', tradeName: 'AlN/SiO₂ ALD', specification: '35 nm', qty: '1 lot', unitCostUsd: 150, extendedUsd: 150, supplier: 'Beneq / Picosun' },
    { id: 'c1', category: 'Coating', component: 'Hydrophobic coat', tradeName: 'Fluoropolymer', specification: '~0.05 mm', qty: '1 side', unitCostUsd: 25, extendedUsd: 25, supplier: 'PPG / specialty' },
    { id: 'pv1', category: 'Photovoltaic', component: 'Edge PV strips', tradeName: 'GaAs strips', specification: '~4.3 m perimeter', qty: '1 set', unitCostUsd: 320, extendedUsd: 320, supplier: 'Specialty GaAs vendors' },
    { id: 'h1', category: 'Hydronic', component: 'Cooling loop', tradeName: '1/4″ copper tube', specification: '~4.5 m', qty: '15 ft', unitCostUsd: 28, extendedUsd: 28, supplier: 'McMaster-Carr' },
    { id: 'h2', category: 'Hydronic', component: 'Coolant', tradeName: '40/60 PG-Water', specification: '0.15–0.25 L propylene glycol mix', qty: '0.25 L', unitCostUsd: 8, extendedUsd: 8, supplier: 'McMaster-Carr' },
    { id: 'e1', category: 'Electrical', component: 'DC bus', tradeName: '16 AWG PTFE', specification: '600 V', qty: '10 ft', unitCostUsd: 12, extendedUsd: 12, supplier: 'Digi-Key' },
    { id: 'e2', category: 'Electrical', component: 'Ribbon busbar', tradeName: '2.0 mm Cu ribbon', specification: 'perimeter', qty: '~4.5 m', unitCostUsd: 18, extendedUsd: 18, supplier: 'Digi-Key' },
    { id: 'e3', category: 'Electrical', component: 'Buck-boost PCB', tradeName: 'Slim DC-DC + RS-485', specification: '120×25×12 mm IP67 potting', qty: '1', unitCostUsd: 95, extendedUsd: 95, supplier: 'JLCPCB / PCBWay' },
    { id: 'e4', category: 'Electrical', component: 'Connectors', tradeName: 'IP67 + 10A fuse', specification: '1 set', qty: '1', unitCostUsd: 22, extendedUsd: 22, supplier: 'Digi-Key' },
    { id: 'f1', category: 'Frame', component: 'Dual-cavity Al frame', tradeName: 'Thermal-break dual chamber', specification: 'Lower weep + upper sealed', qty: '1 set', unitCostUsd: 140, extendedUsd: 140, supplier: 'Kawneer / YKK' },
    { id: 'f2', category: 'Frame', component: 'Sealant', tradeName: 'Structural silicone', specification: 'perimeter kit', qty: '1', unitCostUsd: 35, extendedUsd: 35, supplier: 'Dow / Tremco' },
    { id: 'm1', category: 'Misc', component: 'Potting epoxy', tradeName: 'Thermal epoxy IP67', specification: '50 g upper chamber', qty: '50 g', unitCostUsd: 15, extendedUsd: 15, supplier: 'Ellsworth / 3M' },
  ];
  const totalUsd = lines.reduce((s, l) => s + l.extendedUsd, 0);
  return { lines, totalUsd, costPerSqFt: Math.round((totalUsd / PROTOTYPE.areaSqFt) * 100) / 100 };
}

export interface StackLayer {
  index: number; name: string; material: string; thicknessMm: number;
  thicknessImperial: string; role: string;
}

export function glassStackLayers(coreMm = 4.0) {
  const layers: StackLayer[] = [
    { index: 1, name: 'Top coating', material: 'Hydrophobic fluoropolymer', thicknessMm: 0.05, thicknessImperial: '~2 mils', role: 'Surface' },
    { index: 2, name: 'Outer lite', material: 'Low-iron tempered glass', thicknessMm: 2.0, thicknessImperial: '~5/64″', role: 'Weather face' },
    { index: 3, name: 'Upper interlayer', material: 'OCA', thicknessMm: 0.5, thicknessImperial: '20 mils', role: 'Bond / CTE' },
    { index: 4, name: 'Active core', material: 'Doped Zeonex', thicknessMm: coreMm, thicknessImperial: '~5/32″', role: 'LSC waveguide' },
    { index: 5, name: 'Barrier film', material: 'ALD AlN/SiO₂', thicknessMm: 0.000035, thicknessImperial: '35 nm', role: 'Hermetic' },
    { index: 6, name: 'Lower interlayer', material: 'OCA', thicknessMm: 0.5, thicknessImperial: '20 mils', role: 'Bond / CTE' },
    { index: 7, name: 'Inner lite', material: 'Low-iron tempered glass', thicknessMm: 2.0, thicknessImperial: '~5/64″', role: 'Indoor face' },
  ];
  const totalMm = layers.reduce((s, L) => s + L.thicknessMm, 0);
  const weightKgPerM2 = 2 * 0.002 * 2500 + (coreMm / 1000) * 1000 + 2 * 0.0005 * 1100 + 0.05;
  return {
    layers,
    totalMm: Math.round(totalMm * 1000) / 1000,
    totalInch: Math.round((totalMm / 25.4) * 1000) / 1000,
    weightKgPerM2: Math.round(weightKgPerM2 * 100) / 100,
    weightLbPerSqFt: Math.round(weightKgPerM2 * 0.2048 * 100) / 100,
    zNA_mm: Math.round((0.05 + 2 + 0.5 + coreMm / 2) * 100) / 100,
  };
}

export interface ElectricalSpec {
  primaryBus: string; ribbonBusbar: string; routing: string; inverterFormFactor: string;
  inverterCavity: string; thermalInterface: string; connectors: string; fuse: string;
  rapidShutdown: string; maxCurrentA: number;
  dualCavityFrame: string; lowerChamberWeep: string; upperChamberPotting: string;
  telemetry: string; ipRating: string;
}

export const ELECTRICAL_SPEC: ElectricalSpec = {
  primaryBus: '16 AWG stranded copper, 600 V PTFE insulation',
  ribbonBusbar: '2.0 mm wide tinned copper ribbon on edge PV',
  routing: 'Upper sealed chamber only — never shared with weep path',
  inverterFormFactor: '120 mm × 25 mm × 12 mm slim PCB',
  inverterCavity: 'Upper chamber of dual-cavity thermal-break extrusion',
  thermalInterface: 'Thermally conductive epoxy potting to aluminum extrusion',
  connectors: 'IP67 water-tight quick-connect plugs (MC4-style)',
  fuse: 'Inline 10 A DC fuse on positive bus near inverter input',
  rapidShutdown: 'NEC 690 trigger ≤30 V in 30 s; accessible frame location',
  maxCurrentA: 10,
  dualCavityFrame:
    'Dual-cavity aluminum extrusion with polyamide thermal break: lower pressure-equalized drainage chamber + upper sealed electronics chamber',
  lowerChamberWeep:
    'Pressure-equalized weep holes (∅6 mm typical) at sill; condensation drainage isolated from electrical cavity; exterior screened weeps',
  upperChamberPotting:
    'Fully potted IP67 enclosure for 120×25×12 mm buck-boost microinverter; no path to lower weep chamber',
  telemetry: 'SunSpec-compatible RS-485 transceiver potted with inverter board for monitoring / rapid-shutdown signaling',
  ipRating: 'IP67 (electronics chamber); drainage chamber open by design',
};

export interface AssemblyStep { step: number; title: string; details: string[]; checks: string[]; }

export const ASSEMBLY_STEPS: AssemblyStep[] = [
  { step: 1, title: 'Core preparation & doping', details: ['Cast Zeonex/PMMA core 4.0 mm.', 'Dope Lumogen Red 305 + InP/ZnS QDs under N₂.', 'Cure; apply Penrose P3 nanostructure; ALD 35 nm.'], checks: ['Thickness ±0.1 mm', 'No dye streaks'] },
  { step: 2, title: 'Vacuum-bag lamination', details: ['Clean glass with IPA.', 'Layup: inner glass → OCA (0.5–1.0 mm CTE-tuned) → core → OCA → outer glass.', 'Vacuum ≥25 inHg; cure 80–100 °C.'], checks: ['No bubbles >1 mm', 'Stack ≈9.05 mm'] },
  { step: 3, title: 'Edge PV & hydronic', details: ['Mount GaAs edge strips.', 'Solder 2 mm ribbon busbar.', 'Install 1/4″ copper loop; pressure-test 30 PSI.', 'Fill with 40/60 propylene glycol–water after assembly.'], checks: ['Voc under shop lights', 'No leaks at 30 PSI'] },
  { step: 4, title: 'Wiring & inverter potting (upper chamber)', details: [
    'Route 16 AWG PTFE only through upper dual-cavity chamber — never into weep path.',
    'Seat 120×25×12 mm buck-boost board + SunSpec RS-485 transceiver in upper chamber.',
    'Install inline 10 A fuse and IP67 MC4-style connectors at frame exit.',
    'Fully pot upper chamber with thermally conductive epoxy (IP67).',
  ], checks: ['Polarity marked', 'IR >1 MΩ to frame', 'Upper chamber continuous potting', 'No wire penetration into lower weep chamber'] },
  { step: 5, title: 'Frame, weep paths & final tests', details: [
    'Install laminate into dual-cavity thermal-break frame with structural silicone.',
    'Verify lower chamber: pressure-equalized weep holes clear; sill drainage to exterior screened weeps.',
    'Fill hydronic loop with 40/60 PG-water; pressure-test 30 PSI; bleed air.',
    'Wet-leakage test < 10 µA; NEC 690 rapid-shutdown functional check.',
  ], checks: ['Weep paths open and isolated from electronics', 'Seals continuous', 'RSD ≤30 V in 30 s', 'Hydronic hold 15 min at 30 PSI'] },
];

export type LayerCount = 3 | 5 | 7 | 9 | 11;
export type SubstrateMat = 'Zeonex' | 'PMMA' | 'Polycarbonate' | 'LowIronGlass';
export type InterlayerMat = 'OCA' | 'EVA' | 'PVB' | 'None';
export type CoatingMat = 'ALD_AlN_SiO2' | 'LowE' | 'Fluoropolymer' | 'None';
export type GasFill = 'Air' | 'Argon' | 'Krypton';
export type EdgePvMat = 'GaAs' | 'c-Si';

export interface DynamicStackConfig {
  layerCount: LayerCount; substrate: SubstrateMat; coreThicknessMm: number;
  interlayer: InterlayerMat; coating: CoatingMat; cavityGas: GasFill; edgePv: EdgePvMat;
  lowEEmissivity: number; includeHydronic: boolean; thermalBreakMm: number;
}

export interface DynamicLayer {
  index: number; name: string; material: string; thicknessMm: number;
  EGpa: number; kWmK: number; role: string;
}

export interface DynamicStackResult {
  config: DynamicStackConfig; layers: DynamicLayer[];
  totalMm: number; totalInch: number; weightKgPerM2: number; weightLbPerSqFt: number;
  zNA_mm: number; bomCostUsd: number; uFactor: number; shgc: number; sigmaMaxMPa: number;
  dp105Pass: boolean; etaEl: number; etaTh: number; powerWm2: number; fitness: number; label: string;
}

const SUB_E: Record<SubstrateMat, number> = { Zeonex: 2.1, PMMA: 3.0, Polycarbonate: 2.3, LowIronGlass: 72 };
const SUB_K: Record<SubstrateMat, number> = { Zeonex: 0.14, PMMA: 0.19, Polycarbonate: 0.2, LowIronGlass: 1.05 };
const SUB_N: Record<SubstrateMat, number> = { Zeonex: 1.53, PMMA: 1.49, Polycarbonate: 1.58, LowIronGlass: 1.52 };
const INTER_T: Record<InterlayerMat, number> = { OCA: 0.5, EVA: 0.76, PVB: 0.76, None: 0 };
const INTER_E: Record<InterlayerMat, number> = { OCA: 1.2, EVA: 0.01, PVB: 0.01, None: 0 };
const INTER_K: Record<InterlayerMat, number> = { OCA: 0.18, EVA: 0.25, PVB: 0.22, None: 0.2 };
const GAS_K: Record<GasFill, number> = { Air: 0.026, Argon: 0.017, Krypton: 0.009 };
const PV_ETA: Record<EdgePvMat, number> = { GaAs: 0.28, 'c-Si': 0.22 };
const PV_MATCH: Record<EdgePvMat, number> = { GaAs: 1.0, 'c-Si': 0.92 };

export function buildDynamicStack(config: DynamicStackConfig): DynamicStackResult {
  const layers: DynamicLayer[] = [];
  let idx = 1;
  const add = (name: string, material: string, tMm: number, EGpa: number, kWmK: number, role: string) => {
    if (tMm <= 0) return;
    layers.push({ index: idx++, name, material, thicknessMm: tMm, EGpa, kWmK, role });
  };
  const coreT = config.coreThicknessMm;
  const interT = INTER_T[config.interlayer];
  const eCore = SUB_E[config.substrate];
  const kCore = SUB_K[config.substrate];
  const eInter = INTER_E[config.interlayer] || 1.2;
  const kInter = INTER_K[config.interlayer] || 0.18;
  if (config.coating === 'Fluoropolymer' || config.coating === 'ALD_AlN_SiO2') {
    add('Top coating', config.coating === 'Fluoropolymer' ? 'Fluoropolymer' : 'ALD AlN/SiO2', 0.05, 1.5, 0.25, 'Surface');
  }
  add('Outer lite', 'Low-iron tempered glass', 2.0, 72, 1.05, 'Weather face');
  if (config.layerCount >= 5) add('Upper interlayer', config.interlayer, interT || 0.5, eInter, kInter, 'Bond');
  if (config.layerCount === 3) {
    add('Core / mid lite', config.substrate === 'LowIronGlass' ? 'Low-iron glass' : config.substrate, coreT, eCore, kCore, 'Mid structural');
  } else {
    add('Active core', `${config.substrate} + dye/QD`, coreT, eCore, kCore, 'LSC waveguide');
    if (config.coating === 'ALD_AlN_SiO2') add('Barrier', 'ALD AlN/SiO2', 0.000035, 290, 30, 'Hermetic');
  }
  if (config.layerCount >= 5) add('Lower interlayer', config.interlayer, interT || 0.5, eInter, kInter, 'Bond');
  add('Inner lite', 'Low-iron tempered glass', 2.0, 72, 1.05, 'Indoor face');
  if (config.layerCount >= 9) {
    add('IGU cavity 1', `${config.cavityGas} fill (12 mm)`, 12.0, 0.001, GAS_K[config.cavityGas], 'Thermal cavity');
    add('Mid IGU lite', 'Low-iron glass', 2.0, 72, 1.05, 'IGU mid');
  }
  if (config.layerCount >= 11) {
    add('IGU cavity 2', `${config.cavityGas} fill (12 mm)`, 12.0, 0.001, GAS_K[config.cavityGas], 'Thermal cavity');
    add('Outer IGU lite', 'Low-iron glass', 2.0, 72, 1.05, 'IGU outer');
  }
  let z = 0, num = 0, den = 0;
  for (const L of layers) {
    const zBar = z + L.thicknessMm / 2;
    num += L.EGpa * L.thicknessMm * zBar;
    den += L.EGpa * L.thicknessMm;
    z += L.thicknessMm;
  }
  const zNA = den === 0 ? 0 : num / den;
  const totalMm = z;
  let weightKgPerM2 = 0;
  for (const L of layers) {
    if (L.name.includes('cavity')) continue;
    const rho = L.material.toLowerCase().includes('glass') ? 2500 : L.EGpa > 100 ? 3200 : 1100;
    weightKgPerM2 += (L.thicknessMm / 1000) * rho;
  }
  const kGas = GAS_K[config.cavityGas];
  const eLow = config.coating === 'LowE' || config.lowEEmissivity < 0.1 ? Math.min(0.04, config.lowEEmissivity) : config.lowEEmissivity;
  const hGap = kGas / 0.012;
  const hRad = 4 * 5.67e-8 * Math.pow(293, 3) * Math.max(0.02, eLow);
  const Rgap = 1 / (hGap + hRad);
  let Rcond = 0;
  for (const L of layers) {
    if (L.name.includes('cavity') || L.thicknessMm < 0.001) continue;
    Rcond += L.thicknessMm / 1000 / Math.max(0.05, L.kWmK);
  }
  const nCav = config.layerCount >= 11 ? 2 : config.layerCount >= 9 ? 1 : 0;
  let U = 1.0 / (1 / 8.5 + Rcond * 0.4 + Rgap * Math.max(1, nCav || 0.5) + 1 / 25 + config.thermalBreakMm / 1000 / 0.25);
  U = Math.max(0.35, Math.min(2.8, U));
  const shgc = Math.max(0.15, Math.min(0.5, 0.38 - (config.substrate === 'Zeonex' ? 0.05 : 0) - eLow * 0.1));
  const q = 5.02e3, span = 1.2, M = (q * span * span) / 8;
  let Ieq = 0, zAcc = 0;
  for (const L of layers) {
    if (L.name.includes('cavity')) { zAcc += L.thicknessMm; continue; }
    const zBar = zAcc + L.thicknessMm / 2;
    const t = L.thicknessMm / 1000;
    const n = (L.EGpa * 1e9) / 72e9;
    const d = (zBar - zNA) / 1000;
    Ieq += n * (Math.pow(t, 3) / 12 + t * d * d);
    zAcc += L.thicknessMm;
  }
  const c = Math.max(Math.abs(totalMm - zNA), Math.abs(zNA)) / 1000;
  const sigmaMaxMPa = ((M * c) / Math.max(Ieq, 1e-14) / 1e6) * 0.15;
  const dp105Pass = sigmaMaxMPa < 50;
  const nCore = SUB_N[config.substrate];
  const trap = Math.sqrt(Math.max(0, 1 - Math.pow(1.42 / nCore, 2)));
  const etaEl = Math.min(0.28, PV_ETA[config.edgePv] * PV_MATCH[config.edgePv] * trap * 0.95 * 0.7);
  const etaTh = config.includeHydronic ? Math.min(0.58, 0.45 + (1 - U / 2) * 0.15) : Math.min(0.35, 0.25);
  const powerWm2 = etaEl * 1000;
  let bom = 200;
  bom += 85 * (config.layerCount >= 11 ? 4 : config.layerCount >= 9 ? 3 : 2);
  bom += config.substrate === 'Zeonex' ? 220 : config.substrate === 'PMMA' ? 120 : 90;
  bom += (interT > 0 ? 55 : 0) * 2;
  bom += config.coating === 'ALD_AlN_SiO2' ? 150 : config.coating === 'LowE' ? 40 : 25;
  bom += config.edgePv === 'GaAs' ? 320 : 180;
  bom += config.includeHydronic ? 50 : 0;
  bom += config.cavityGas === 'Krypton' ? 40 : config.cavityGas === 'Argon' ? 15 : 0;
  bom += 95 + 140;
  if (config.layerCount >= 9) bom += 120;
  if (config.layerCount >= 11) bom += 100;
  const lifetimeEnergy = powerWm2 * 25 * 1200 * 0.001;
  const fitness = (etaEl * 100 * etaTh * 100 * Math.max(0.1, lifetimeEnergy)) / (bom * Math.max(0.4, U));
  return {
    config, layers,
    totalMm: Math.round(totalMm * 1000) / 1000,
    totalInch: Math.round((totalMm / 25.4) * 1000) / 1000,
    weightKgPerM2: Math.round(weightKgPerM2 * 100) / 100,
    weightLbPerSqFt: Math.round(weightKgPerM2 * 0.2048 * 100) / 100,
    zNA_mm: Math.round(zNA * 100) / 100,
    bomCostUsd: Math.round(bom),
    uFactor: Math.round(U * 1000) / 1000,
    shgc: Math.round(shgc * 1000) / 1000,
    sigmaMaxMPa: Math.round(sigmaMaxMPa * 10) / 10,
    dp105Pass,
    etaEl: Math.round(etaEl * 10000) / 100,
    etaTh: Math.round(etaTh * 10000) / 100,
    powerWm2: Math.round(powerWm2 * 10) / 10,
    fitness: Math.round(fitness * 100) / 100,
    label: `${config.layerCount}L ${config.substrate}/${config.edgePv}/${config.cavityGas}`,
  };
}

export const SWEEP_SUBSTRATES: SubstrateMat[] = ['Zeonex', 'PMMA', 'Polycarbonate', 'LowIronGlass'];
export const SWEEP_INTERLAYERS: InterlayerMat[] = ['OCA', 'EVA', 'PVB'];
export const SWEEP_COATINGS: CoatingMat[] = ['ALD_AlN_SiO2', 'LowE', 'Fluoropolymer'];
export const SWEEP_GASES: GasFill[] = ['Air', 'Argon', 'Krypton'];
export const SWEEP_PV: EdgePvMat[] = ['GaAs', 'c-Si'];
export const SWEEP_LAYERS: LayerCount[] = [3, 5, 7, 9, 11];

export interface CsiSubmittalData {
  projectTitle: string; sectionGlazing: string; sectionCurtainWall: string;
  productName: string; description: string;
  structural: string[]; thermalOptical: string[]; electrical: string[]; warranty: string[];
  bomSummary: string;
}

export function buildCsiSubmittal(opts: {
  uFactor: number; shgc: number; dpCapable: boolean; nec690: boolean;
  bomTotalUsd: number; netPowerWm2: number; tauMaxKPa: number; cteOk: boolean;
}): CsiSubmittalData {
  return {
    projectTitle: 'Solastrata™ BIPV-T Glazing System — Architectural Submittal',
    sectionGlazing: '08 80 00 — Glazing',
    sectionCurtainWall: '08 44 00 — Curtain Wall and Glazed Assemblies (BIPV-T)',
    productName: 'Solastrata™ Luminescent Solar Concentrator Window (BIPV-T)',
    description:
      'Active BIPV-T laminated glazing with LSC polymer core, edge PV, dual-cavity IP67 frame, and hydronic recovery. Digital twin: Solastrata™ BIPV-T Active Glazing Systems.',
    structural: [
      `Wind load: ${opts.dpCapable ? 'Capable of DP105 (5.02 kPa) per ASTM E1300 methodology' : 'Review span/thickness for DP105'}`,
      `CTE interfacial shear τ_max ≈ ${opts.tauMaxKPa} kPa — ${opts.cteOk ? 'within OCA yield' : 'review interlayer'}`,
    ],
    thermalOptical: [
      `NFRC 100 U-factor: ${opts.uFactor} W/m²·K`,
      `NFRC 200 SHGC: ${opts.shgc}`,
    ],
    electrical: [
      `Net power density ≈ ${opts.netPowerWm2} W/m² (after pump parasitic)`,
      `NEC 690 rapid shutdown: ${opts.nec690 ? 'Compliant path' : 'Verify'}`,
      'IP67 potted upper chamber microinverter + RS-485 telemetry',
    ],
    warranty: [
      'Materials and workmanship per manufacturer schedule',
      'Edge PV power warranty path consistent with 0.5%/yr degradation model',
    ],
    bomSummary: `Prototype BOM total ≈ $${opts.bomTotalUsd} (indicative)`,
  };
}
