import { useMemo, useState } from 'react';
import {
  DEFAULT_PARAMS,
  DesignParams,
  computePhysics,
  paramsToLabels,
} from './lib/engine';

type TabId =
  | 'overview'
  | 'optics'
  | 'thermal'
  | 'structural'
  | 'electrical'
  | 'compliance'
  | 'parameters';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'optics', label: 'Optics / LSC' },
  { id: 'thermal', label: 'Thermal / BIPV-T' },
  { id: 'structural', label: 'Structural' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'parameters', label: '22 Parameters' },
];

function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  const color =
    tone === 'ok' ? 'var(--good)' : tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : undefined;
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [params, setParams] = useState<DesignParams>({ ...DEFAULT_PARAMS });
  const [tab, setTab] = useState<TabId>('overview');
  const [Gsolar, setGsolar] = useState(1000);
  const [Tamb, setTamb] = useState(25);

  const m = useMemo(() => computePhysics(params, Gsolar, Tamb), [params, Gsolar, Tamb]);
  const labels = useMemo(() => paramsToLabels(params), [params]);

  const update = <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>AegisSash Executive Portal</h1>
          <span>
            BIPV-T photonic-thermal digital twin · v84.0.0 · Docket AEGIS-PROV-2026-01
          </span>
        </div>
        <div className="badge-row">
          <span className={`badge ${m.nfrc100Pass ? 'ok' : 'fail'}`}>
            NFRC 100 {m.nfrc100Pass ? 'PASS' : 'FAIL'}
          </span>
          <span className={`badge ${m.nfrc200Pass ? 'ok' : 'fail'}`}>
            NFRC 200 {m.nfrc200Pass ? 'PASS' : 'FAIL'}
          </span>
          <span className={`badge ${m.dp105Capable ? 'ok' : 'fail'}`}>
            DP105 {m.dp105Capable ? 'OK' : 'CHECK'}
          </span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <h3 className="section-title">Operating conditions</h3>
          <div className="field">
            <label>Solar irradiance G (W/m²)</label>
            <input type="number" min={0} max={1200} value={Gsolar} onChange={(e) => setGsolar(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Ambient temperature (°C)</label>
            <input type="number" min={-20} max={50} value={Tamb} onChange={(e) => setTamb(Number(e.target.value))} />
          </div>

          <h3 className="section-title">Key design levers</h3>
          <div className="field">
            <label>Matrix polymer (P1)</label>
            <select value={params.basePolymer} onChange={(e) => update('basePolymer', e.target.value as DesignParams['basePolymer'])}>
              <option value="Zeonex_150ppm">Zeonex 150ppm</option>
              <option value="PMMA">PMMA</option>
              <option value="Polycarbonate">Polycarbonate</option>
              <option value="Glass">Glass</option>
            </select>
          </div>
          <div className="field">
            <label>Lattice geometry (P3)</label>
            <select value={params.latticeGeometry} onChange={(e) => update('latticeGeometry', e.target.value as DesignParams['latticeGeometry'])}>
              <option value="Penrose_P3">Penrose P3</option>
              <option value="Hexagonal">Hexagonal</option>
              <option value="Square">Square</option>
              <option value="E8_Projection">E8 Projection</option>
            </select>
          </div>
          <div className="field">
            <label>Dye dopant (P6)</label>
            <select value={params.dyeDopant} onChange={(e) => update('dyeDopant', e.target.value as DesignParams['dyeDopant'])}>
              <option value="Lumogen_Red_305">Lumogen F Red 305</option>
              <option value="Lumogen_Yellow_083">Lumogen F Yellow 083</option>
              <option value="None">None</option>
            </select>
          </div>
          <div className="field">
            <label>Dye concentration ppm (P7)</label>
            <input type="number" min={10} max={500} value={params.dyeConcentrationPpm} onChange={(e) => update('dyeConcentrationPpm', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>QD core (P8)</label>
            <select value={params.qdCore} onChange={(e) => update('qdCore', e.target.value as DesignParams['qdCore'])}>
              <option value="InP">InP</option>
              <option value="CuInS2">CuInS2</option>
              <option value="CdSe">CdSe</option>
              <option value="CsPbBr3">Perovskite CsPbBr3</option>
            </select>
          </div>
          <div className="field">
            <label>Edge PV material (P14)</label>
            <select value={params.pvMaterial} onChange={(e) => update('pvMaterial', e.target.value as DesignParams['pvMaterial'])}>
              <option value="GaN">GaN</option>
              <option value="c-Si">c-Si</option>
              <option value="GaAs">GaAs</option>
              <option value="SiC">SiC</option>
              <option value="Perovskite">Perovskite</option>
            </select>
          </div>
          <div className="field">
            <label>Mass flow ṁ kg/s (P17)</label>
            <input type="number" min={0.01} max={0.5} step={0.01} value={params.massFlowKgS} onChange={(e) => update('massFlowKgS', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Thermal break width mm (P22)</label>
            <input type="number" min={5} max={30} value={params.thermalBreakWidthMm} onChange={(e) => update('thermalBreakWidthMm', Number(e.target.value))} />
          </div>
          <div className="btn-row">
            <button className="btn secondary" type="button" onClick={() => setParams({ ...DEFAULT_PARAMS })}>
              Reset baseline
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="Electrical η" value={m.electricalEfficiencyPct} unit="%" tone="ok" />
                <Metric label="Thermal η" value={m.thermalEfficiencyPct} unit="%" tone="ok" />
                <Metric label="Power density" value={m.powerDensityWm2} unit="W/m²" />
                <Metric label="Thermal power" value={m.thermalPowerWm2} unit="W/m²" />
                <Metric label="U-factor" value={m.uFactor} unit="W/m²·K" tone={m.nfrc100Pass ? 'ok' : 'bad'} />
                <Metric label="SHGC" value={m.shgc} tone={m.nfrc200Pass ? 'ok' : 'warn'} />
                <Metric label="Cell temp" value={m.cellTempC} unit="°C" />
                <Metric label="Combined yield" value={m.combinedYieldWm2} unit="W/m²" />
              </div>
              <div className="two-col">
                <div className="card">
                  <h3 className="section-title">Energy balance</h3>
                  <div className="formula">{
`α_sol · G_solar = P_electrical + Q_thermal + Q_loss\n\nQ_thermal = ṁ · C_p · (T_out − T_in)\nη_el target ≈ 18.2%   η_th target ≈ 55.4%\nBaseline polymer: Zeonex (n=1.53, E≈2.1 GPa)`
                  }</div>
                </div>
                <div className="card">
                  <h3 className="section-title">Live parameter snapshot</h3>
                  <div className="param-list">
                    {labels.slice(0, 8).map((row) => (
                      <div key={row.key}>
                        <span>{row.key}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'optics' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="T_vis" value={m.opticalTransparency} />
                <Metric label="Haze" value={m.hazePct} unit="%" />
                <Metric label="Path enhancement F" value={m.pathLengthEnhancement} />
                <Metric label="FRET efficiency" value={(m.fretEfficiency * 100).toFixed(1)} unit="%" />
                <Metric label="Trap fraction" value={m.trapFraction} />
              </div>
              <div className="card">
                <h3 className="section-title">Photonic crystal & LSC / FRET (PDF §4)</h3>
                <div className="formula">{
`Penrose P3 quasi-crystal · FRET E = R0^6/(R0^6+r^6) · TIR waveguide n=1.53 → edge PV`
                }</div>
              </div>
            </div>
          )}

          {tab === 'thermal' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="η_thermal" value={m.thermalEfficiencyPct} unit="%" />
                <Metric label="U-factor" value={m.uFactor} unit="W/m²·K" />
                <Metric label="Fluid ΔT" value={m.fluidDeltaT} unit="K" />
                <Metric label="Cell temperature" value={m.cellTempC} unit="°C" />
                <Metric label="Nocturnal TEG" value={m.nocturnalTEGWm2} unit="W/m²" />
              </div>
            </div>
          )}

          {tab === 'structural' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="Neutral axis z_NA" value={m.neutralAxisMm} unit="mm" />
                <Metric label="σ_max flexure" value={m.maxFlexuralStressMPa} unit="MPa" />
                <Metric label="WVTR" value={m.wvtr.toExponential(1)} unit="g/m²/day" />
                <Metric label="DP105 capacity" value={m.dp105Capable ? 'Capable' : 'Review'} tone={m.dp105Capable ? 'ok' : 'warn'} />
              </div>
            </div>
          )}

          {tab === 'electrical' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="η_electrical" value={m.electricalEfficiencyPct} unit="%" />
                <Metric label="Power density" value={m.powerDensityWm2} unit="W/m²" />
                <Metric label="Inverter" value={params.inverterTopology.replace(/_/g, ' ')} />
                <Metric label="PV material" value={params.pvMaterial} />
              </div>
            </div>
          )}

          {tab === 'compliance' && (
            <div className="card">
              <h3 className="section-title">Standards compliance matrix</h3>
              <div className="param-list">
                <div><span>NFRC 100 U ≤ 0.85</span><span className={m.nfrc100Pass ? 'pass' : 'fail'}>{m.uFactor} · {m.nfrc100Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>NFRC 200 SHGC 0.20–0.40</span><span className={m.nfrc200Pass ? 'pass' : 'fail'}>{m.shgc} · {m.nfrc200Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>ASTM E1300 / DP105</span><span className={m.dp105Capable ? 'pass' : 'fail'}>{m.dp105Capable ? 'PASS' : 'REVIEW'}</span></div>
              </div>
            </div>
          )}

          {tab === 'parameters' && (
            <div className="card">
              <h3 className="section-title">Full 22-parameter design vector</h3>
              <div className="param-list">
                {labels.map((row) => (
                  <div key={row.key}>
                    <span>{row.key}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
