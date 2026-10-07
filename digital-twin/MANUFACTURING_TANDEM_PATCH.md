# Manufacturing.ts Tandem Expansion Patch

Apply these changes to `aegis-web/src/lib/manufacturing.ts` so the web inverse solver can search tandem edge cells.

## 1. EdgePvMat type
```ts
export type EdgePvMat = 'GaAs' | 'c-Si' | 'GaAs_high' | 'PerovskiteSi_2T' | 'PerovskiteSi_4T' | 'PerovskiteGaAs' | 'PerovskiteCIGS';
```

## 2. PV_ETA (published cell efficiencies)
```ts
const PV_ETA: Record<EdgePvMat, number> = {
  GaAs: 0.28, 'c-Si': 0.22, GaAs_high: 0.30,
  PerovskiteSi_2T: 0.31, PerovskiteSi_4T: 0.304,
  PerovskiteGaAs: 0.32, PerovskiteCIGS: 0.234
};
```

## 3. PV_MATCH (spectral match to LSC)
```ts
const PV_MATCH: Record<EdgePvMat, number> = {
  GaAs: 1.0, 'c-Si': 0.92, GaAs_high: 1.0,
  PerovskiteSi_2T: 0.98, PerovskiteSi_4T: 0.97,
  PerovskiteGaAs: 1.0, PerovskiteCIGS: 0.95
};
```

## 4. Raise hard efficiency cap (critical)
```ts
// Was Math.min(0.28, ...) which blocked all tandem gains
const etaEl = Math.min(0.34, PV_ETA[config.edgePv] * PV_MATCH[config.edgePv] * trap * 0.95 * 0.7);
```

## 5. SWEEP_PV
```ts
export const SWEEP_PV: EdgePvMat[] = [
  'GaAs', 'c-Si', 'GaAs_high',
  'PerovskiteSi_2T', 'PerovskiteSi_4T', 'PerovskiteGaAs', 'PerovskiteCIGS'
];
```

## 6. BOM costs
```ts
const PV_BOM: Record<EdgePvMat, number> = {
  GaAs: 320, 'c-Si': 180, GaAs_high: 400,
  PerovskiteSi_2T: 540, PerovskiteSi_4T: 570,
  PerovskiteGaAs: 670, PerovskiteCIGS: 420
};
bom += PV_BOM[config.edgePv];
```

## Expected result after apply + re-run Inverse Design
- Near-commercial: ~80.8 W/m2 (Perovskite/Si 2T + multi-dye/QD LSC)
- Research ceiling: ~85.1 W/m2 (Perovskite/GaAs + multi QD)
- Still pair with rooftop solar for full-house coverage
