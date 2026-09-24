/**
 * Physical manufacturing data — BOM, glass stack, electrical, assembly
 * Reference unit: 3' × 5' (36" × 60") prototype window = 0.914 m × 1.524 m = 1.393 m²
 * Docket AEGIS-PROV-2026-01
 */

export const PROTOTYPE = {
  widthIn: 36,
  heightIn: 60,
  widthM: 0.914,
  heightM: 1.524,
  areaM2: 1.393,
  areaSqFt: 15.0,
  label: '3′ × 5′ (36″ × 60″) prototype',
} as const;

export interface BomLine {
  id: string;
  category: string;
  component: string;
  tradeName: string;
  specification: string;
  qty: string;
  unitCostUsd: number;
  extendedUsd: number;
  supplier: string;
  notes?: string;
}

export function buildBom(): { lines: BomLine[]; totalUsd: number; costPerSqFt: number } {
  const lines: BomLine[] = [
    { id: 'g1', category: 'Glass', component: 'Outer lite', tradeName: 'Low-iron tempered float glass', specification: '36″ × 60″ × 2.0 mm (~5/64″), polished edges', qty: '1 sheet', unitCostUsd: 85, extendedUsd: 85, supplier: 'Guardian / Vitro / local glass fabricator' },
    { id: 'g2', category: 'Glass', component: 'Inner lite', tradeName: 'Low-iron tempered float glass', specification: '36″ × 60″ × 2.0 mm (~5/64″), polished edges', qty: '1 sheet', unitCostUsd: 85, extendedUsd: 85, supplier: 'Guardian / Vitro / local glass fabricator' },
    { id: 'p1', category: 'Polymer core', component: 'Optical waveguide core', tradeName: 'Zeonex 480R (or optical-grade PMMA)', specification: '36″ × 60″ × 4.0 mm sheet; n≈1.53; doped after casting', qty: '1 panel (~5.6 kg)', unitCostUsd: 220, extendedUsd: 220, supplier: 'Zeon Corp / specialty polymer distributors' },
    { id: 'd1', category: 'Fluorophore', component: 'Organic dye dopant', tradeName: 'Lumogen F Red 305', specification: 'Target 125–150 ppm in core volume', qty: '~0.8 g', unitCostUsd: 45, extendedUsd: 45, supplier: 'BASF / Sigma-Aldrich' },
    { id: 'qd1', category: 'Quantum dots', component: 'Core-shell QDs', tradeName: 'InP/ZnS quantum dots', specification: 'd≈3.2 nm; emission ~620 nm; ~450 ppm', qty: '~2.5 g dispersion', unitCostUsd: 180, extendedUsd: 180, supplier: 'NN-Labs / Sigma-Aldrich / Nanoco' },
    { id: 'a1', category: 'Adhesive', component: 'Upper OCA interlayer', tradeName: 'Optically clear acrylic OCA', specification: '36″ × 60″ × 0.5 mm (20 mil) sheet', qty: '1 sheet', unitCostUsd: 55, extendedUsd: 55, supplier: '3M 8146 / Ellsworth Adhesives' },
    { id: 'a2', category: 'Adhesive', component: 'Lower OCA interlayer', tradeName: 'Optically clear acrylic OCA', specification: '36″ × 60″ × 0.5 mm (20 mil) sheet', qty: '1 sheet', unitCostUsd: 55, extendedUsd: 55, supplier: '3M 8146 / Ellsworth Adhesives' },
    { id: 'b1', category: 'Barrier', component: 'Hermetic ALD barrier', tradeName: 'AlN/SiO₂ multi-layer ALD', specification: '35 nm total on core faces (contract coating)', qty: '1 panel process lot', unitCostUsd: 150, extendedUsd: 150, supplier: 'Beneq / Picosun / university ALD service', notes: 'WVTR target < 10⁻⁶ g/m²/day' },
    { id: 'c1', category: 'Coating', component: 'Exterior hydrophobic coat', tradeName: 'Fluoropolymer (e.g. PVDF / fluoroacrylic)', specification: '~0.05 mm (2 mil) spray or dip', qty: '1 side', unitCostUsd: 25, extendedUsd: 25, supplier: 'PPG / Sherwin / specialty coatings' },
    { id: 'pv1', category: 'Photovoltaic', component: 'Edge PV strips', tradeName: 'GaAs thin-film or cell strips', specification: 'Perimeter edge; ~8–12 mm wide; red-matched', qty: '~4.3 m total length', unitCostUsd: 320, extendedUsd: 320, supplier: 'Alta Devices / specialty GaAs vendors' },
    { id: 'h1', category: 'Hydronic', component: 'Cooling loop tubing', tradeName: 'Copper tube, soft annealed', specification: '1/4″ OD (6.35 mm); ~4.5 m run', qty: '15 ft', unitCostUsd: 28, extendedUsd: 28, supplier: 'McMaster-Carr 5174K11' },
    { id: 'h2', category: 'Hydronic', component: 'Coolant fill', tradeName: 'Ethylene glycol 50/50 premix', specification: 'Loop volume ~0.15–0.25 L', qty: '0.25 L', unitCostUsd: 8, extendedUsd: 8, supplier: 'McMaster-Carr / automotive suppliers' },
    { id: 'e1', category: 'Electrical', component: 'DC bus wire', tradeName: '16 AWG stranded Cu, PTFE insulation', specification: '600 V PTFE; high-temp; ~3 m', qty: '10 ft', unitCostUsd: 12, extendedUsd: 12, supplier: 'McMaster-Carr / Digi-Key (Alpha Wire)' },
    { id: 'e2', category: 'Electrical', component: 'Edge busbar ribbon', tradeName: 'Tinned copper ribbon', specification: '2.0 mm wide × 0.1 mm; perimeter solder', qty: '~4.5 m', unitCostUsd: 18, extendedUsd: 18, supplier: 'Ulbrich / Digi-Key' },
    { id: 'e3', category: 'Electrical', component: 'Buck-boost inverter board', tradeName: 'Custom slim DC-DC PCB', specification: '120 × 25 × 12 mm; nests in 18 mm thermal break', qty: '1 board', unitCostUsd: 95, extendedUsd: 95, supplier: 'JLCPCB / PCBWay + assembly', notes: 'NEC 690 rapid-shutdown compatible' },
    { id: 'e4', category: 'Electrical', component: 'Connectors & protection', tradeName: 'IP67 MC4-style + 10 A fuse', specification: 'Quick-connect pair + inline fuse holder', qty: '1 set', unitCostUsd: 22, extendedUsd: 22, supplier: 'Digi-Key / Phoenix Contact' },
    { id: 'f1', category: 'Frame', component: 'Aluminum frame extrusion', tradeName: 'Thermal-break window frame', specification: '18 mm polyamide thermal break channel', qty: '1 perimeter set', unitCostUsd: 140, extendedUsd: 140, supplier: 'Kawneer / YKK / local extruder' },
    { id: 'f2', category: 'Frame', component: 'Sealant & gaskets', tradeName: 'Structural silicone + EPDM', specification: 'Perimeter wet seal + setting blocks', qty: '1 kit', unitCostUsd: 35, extendedUsd: 35, supplier: 'Dow Corning / Tremco / McMaster-Carr' },
    { id: 'm1', category: 'Misc', component: 'Potting epoxy (inverter)', tradeName: 'Thermally conductive epoxy', specification: 'Fill board cavity to frame extrusion', qty: '50 g', unitCostUsd: 15, extendedUsd: 15, supplier: 'Ellsworth / Loctite / 3M' },
  ];
  const totalUsd = lines.reduce((s, l) => s + l.extendedUsd, 0);
  return { lines, totalUsd, costPerSqFt: Math.round((totalUsd / PROTOTYPE.areaSqFt) * 100) / 100 };
}

export interface StackLayer {
  index: number;
  name: string;
  material: string;
  thicknessMm: number;
  thicknessImperial: string;
  role: string;
}

export function glassStackLayers(coreMm = 4.0): {
  layers: StackLayer[];
  totalMm: number;
  totalInch: number;
  weightKgPerM2: number;
  weightLbPerSqFt: number;
  zNA_mm: number;
} {
  const layers: StackLayer[] = [
    { index: 1, name: 'Top coating', material: 'Hydrophobic fluoropolymer', thicknessMm: 0.05, thicknessImperial: '~2 mils', role: 'Dirt shedding, radiative cooling ε≈0.95' },
    { index: 2, name: 'Outer lite', material: 'Low-iron tempered glass', thicknessMm: 2.0, thicknessImperial: '~5/64″', role: 'Structural, weather face' },
    { index: 3, name: 'Upper interlayer', material: 'Optically clear elastomeric OCA', thicknessMm: 0.5, thicknessImperial: '20 mils', role: 'Bond outer glass to core' },
    { index: 4, name: 'Active core', material: 'Doped Zeonex waveguide (dye + QDs)', thicknessMm: coreMm, thicknessImperial: '~5/32″ (at 4.0 mm)', role: 'LSC waveguide + FRET cascade' },
    { index: 5, name: 'Barrier film', material: 'ALD AlN/SiO₂ hermetic coating', thicknessMm: 0.000035, thicknessImperial: '35 nm', role: 'WVTR/OTR barrier on core' },
    { index: 6, name: 'Lower interlayer', material: 'Optically clear elastomeric OCA', thicknessMm: 0.5, thicknessImperial: '20 mils', role: 'Bond core to inner glass' },
    { index: 7, name: 'Inner lite', material: 'Low-iron tempered glass', thicknessMm: 2.0, thicknessImperial: '~5/64″', role: 'Structural, indoor face' },
  ];
  const totalMm = layers.reduce((s, L) => s + L.thicknessMm, 0);
  const weightKgPerM2 =
    2 * (2.0 / 1000) * 2500 +
    (coreMm / 1000) * 1000 +
    2 * (0.5 / 1000) * 1100 +
    0.05;
  const weightLbPerSqFt = weightKgPerM2 * 0.2048;
  const zNA_mm = 0.05 + 2.0 + 0.5 + coreMm / 2;
  return {
    layers,
    totalMm: Math.round(totalMm * 1000) / 1000,
    totalInch: Math.round((totalMm / 25.4) * 1000) / 1000,
    weightKgPerM2: Math.round(weightKgPerM2 * 100) / 100,
    weightLbPerSqFt: Math.round(weightLbPerSqFt * 100) / 100,
    zNA_mm: Math.round(zNA_mm * 100) / 100,
  };
}

export interface ElectricalSpec {
  primaryBus: string;
  ribbonBusbar: string;
  routing: string;
  inverterFormFactor: string;
  inverterCavity: string;
  thermalInterface: string;
  connectors: string;
  fuse: string;
  rapidShutdown: string;
  maxCurrentA: number;
}

export const ELECTRICAL_SPEC: ElectricalSpec = {
  primaryBus: '16 AWG stranded copper, 600 V PTFE/Teflon insulation, high-temperature',
  ribbonBusbar: '2.0 mm wide tinned copper ribbon soldered along perimeter edge PV strips',
  routing:
    'DC bus runs inside hollow aluminum perimeter frame and 18 mm polyamide thermal-break channel; keep bends ≥ 4× wire OD',
  inverterFormFactor: 'Slim inline PCB 120 mm (L) × 25 mm (W) × 12 mm (H)',
  inverterCavity: 'Nests inside 18 mm (~3/4″) frame thermal-break channel',
  thermalInterface: 'Thermally conductive epoxy potting from board to aluminum extrusion',
  connectors: 'IP67 water-tight quick-connect plugs (MC4-style or equivalent)',
  fuse: 'Inline 10 A DC fuse on positive bus near inverter input',
  rapidShutdown: 'NEC 690-compliant rapid-shutdown trigger at accessible frame location (≤30 V within 30 s)',
  maxCurrentA: 10,
};

export interface AssemblyStep {
  step: number;
  title: string;
  details: string[];
  checks: string[];
}

export const ASSEMBLY_STEPS: AssemblyStep[] = [
  {
    step: 1,
    title: 'Core preparation & doping',
    details: [
      'Cast or machine Zeonex/PMMA core to 4.0 mm nominal thickness and final plan size (36″ × 60″).',
      'Dissolve Lumogen F Red 305 to 125–150 ppm and disperse InP/ZnS QDs (~450 ppm) into monomer or solvent system; mix under dry N₂.',
      'Cure per resin datasheet; verify T_vis > 90% and haze ≈ 1.1% after Penrose P3 nanostructure transfer (nanoimprint or master mold).',
      'Send core for multi-layer ALD AlN/SiO₂ (≈35 nm) on both faces if not done in-house.',
    ],
    checks: [
      'Core thickness ±0.1 mm over full area',
      'No visible dye streaks or QD agglomerates',
      'WVTR/OTR certificate if ALD is outsourced',
    ],
  },
  {
    step: 2,
    title: 'Vacuum-bag / autoclave lamination',
    details: [
      'Clean both low-iron glass lites (2.0 mm) with IPA; lint-free wipe only.',
      'Layup order (bottom → top): inner glass → OCA (0.5 mm) → ALD-coated core → OCA (0.5 mm) → outer glass. Apply fluoropolymer topcoat after cure if spray process.',
      'Vacuum bag: pull ≥ 25 inHg (≈85 kPa); hold 20–30 min at room temp to de-air.',
      'Cure profile (typical acrylic OCA): ramp to 80–100 °C, hold 30–60 min under vacuum or light pressure (autoclave 3–5 bar if available); cool under pressure.',
    ],
    checks: [
      'No trapped air bubbles > 1 mm',
      'Edge squeeze-out continuous; trim after cool-down',
      'Total stack thickness ≈ 9.05 mm',
    ],
  },
  {
    step: 3,
    title: 'Edge PV & hydronic loop',
    details: [
      'Mount GaAs edge-PV strips along all four edges of the laminated panel; optically couple to core edge (index-matched adhesive).',
      'Solder 2.0 mm ribbon busbar along PV interconnect pads; leave leads for 16 AWG bus.',
      'Form 1/4″ OD copper tubing into perimeter cooling loop; attach to frame channel with thermal paste or clips.',
      'Pressure-test dry loop at 30 PSI for 15 minutes before coolant fill.',
    ],
    checks: [
      'Open-circuit voltage of edge string under shop lights',
      'No coolant leaks at fittings at 30 PSI',
      'PV strips fully seated against core edge',
    ],
  },
  {
    step: 4,
    title: 'Wiring & inverter potting',
    details: [
      'Route 16 AWG PTFE wire from ribbon bus to slim buck-boost board (120 × 25 × 12 mm) in thermal-break cavity.',
      'Install inline 10 A fuse on positive conductor; land IP67 connectors at exterior frame exit.',
      'Mount rapid-shutdown initiator per NEC 690 at accessible location.',
      'Pot inverter board with thermally conductive epoxy against aluminum extrusion; cure per epoxy datasheet.',
    ],
    checks: [
      'Polarity marked at connectors',
      'Insulation resistance > 1 MΩ to frame',
      'Board fully seated; potting flush, no voids at heat path',
    ],
  },
  {
    step: 5,
    title: 'Frame assembly & final tests',
    details: [
      'Install laminated unit into thermal-break aluminum frame with setting blocks and structural silicone perimeter seal.',
      'Fill hydronic loop with 50/50 ethylene glycol; bleed air; re-check 30 PSI hold.',
      'Electrical wet-leakage test (UL 61730 style): leakage < 10 µA under specified voltage.',
      'Functional check: irradiance lamp or outdoor → measure DC power and fluid ΔT under circulating flow (~0.12–0.15 kg/s).',
    ],
    checks: [
      'Frame plumb/square; seals continuous',
      'Hydronic pressure stable 15 min at 30 PSI',
      'Wet leakage pass; rapid-shutdown trips to ≤30 V',
    ],
  },
];
