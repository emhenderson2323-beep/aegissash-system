import { useCallback, useMemo, useState } from 'react';
import {
  DesignParams,
  computePhysics,
  paramsToLabels,
  evaluateHamiltonian,
  buildLaminateStack,
  computeNeutralAxis,
} from './lib/engine';
import {
  autoCorrectParameters,
  clampToCompliantBand,
  getCompliantDefaults,
  CorrectionLog,
} from './utils/solver';

type TabId =
  | 'overview' | 'optics' | 'thermal' | 'structural' | 'nocturnal'
  | 'electrical' | 'compliance' | 'parameters' | 'qubo';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'optics', label: 'Optics / LSC' },
  { id: 'thermal', label: 'Thermal / BIPV-T' },
  { id: 'structural', label: 'Structural' },
  { id: 'nocturnal', label: 'Nocturnal' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'parameters', label: '22 Parameters' },
  { id: 'qubo', label: 'QUBO / FNO' },
];

function Metric({
  label, value, unit, tone,
}: {
  label: string; value: string | number; unit?: string; tone?: 'ok' | 'warn' | 'bad';
}) {
  const color =
    tone === 'ok' ? 'var(--good)' : tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : undefined;
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>
        {value}{unit ? <span className="unit">{unit}</span> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [params, setParams] = useState<DesignParams>(() => getCompliantDefaults());
  const [tab, setTab] = useState<TabId>('overview');
  const [Gsolar, setGsolar] = useState(1000);
  const [Tamb, setTamb] = useState(25);
  const [autoCorrectMode, setAutoCorrectMode] = useState(true);
  const [lastCorrections, setLastCorrections] = useState<CorrectionLog[]>([]);

  const m = useMemo(() => computePhysics(params, Gsolar, Tamb), [params, Gsolar, Tamb]);
  const labels = useMemo(() => paramsToLabels(params), [params]);
  const H = useMemo(() => evaluateHamiltonian(m), [m]);
  const laminate = useMemo(() => {
    const layers = buildLaminateStack(params);
    return { layers, ...computeNeutralAxis(layers) };
  }, [params]);

  const applyParams = useCallback(
    (next: DesignParams) => setParams(autoCorrectMode ? clampToCompliantBand(next) : next),
    [autoCorrectMode],
  );
  const update = <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => {
    applyParams({ ...params, [key]: value });
  };
  const runAutoSolve = () => {
    const result = autoCorrectParameters(params, Gsolar, Tamb);
    setParams(result.params);
    setLastCorrections(result.corrections);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>AegisSash Executive Portal</h1>
          <span>Docket AEGIS-PROV-2026-01 · USPTO 64/158,837 · v84.0.0-PROD-AUDIT</span>
        </div>
        <div className="badge-row">
          <span className={`badge ${m.nfrc100Pass ? 'ok' : 'fail'}`}>NFRC 100 {m.nfrc100Pass ? 'PASS' : 'FAIL'}</span>
          <span className={`badge ${m.nfrc200Pass ? 'ok' : 'fail'}`}>NFRC 200 {m.nfrc200Pass ? 'PASS' : 'FAIL'}</span>
          <span className={`badge ${m.dp105Capable ? 'ok' : 'fail'}`}>DP105 {m.dp105Capable ? 'OK' : 'CHECK'}</span>
          <span className={`badge ${m.nec690Pass ? 'ok' : 'fail'}`}>NEC 690</span>
          <span className={`badge ${m.ul61730Pass ? 'ok' : 'fail'}`}>UL 61730</span>
          <span className={`badge ${m.ieee1547Pass ? 'ok' : 'fail'}`}>IEEE 1547</span>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <h3 className="section-title">Auto-correction</h3>
          <div className="btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn" type="button" onClick={runAutoSolve}>⚡ Auto-Solve & Fix All Errors</button>
            <label className="toggle-row">
              <input type="checkbox" checked={autoCorrectMode} onChange={(e) => {
                const on = e.target.checked;
                setAutoCorrectMode(on);
                if (on) setParams(clampToCompliantBand(params));
              }} />
              <span>Auto-Correct Mode (live clamp)</span>
            </label>
          </div>
          {lastCorrections.length > 0 && (
            <div className="correction-log">
              <div className="label">Last solver actions ({lastCorrections.length})</div>
              <ul>{lastCorrections.slice(0, 8).map((c, i) => (
                <li key={`${c.field}-${i}`}><strong>{c.field}</strong>: {String(c.from)} → {String(c.to)}</li>
              ))}</ul>
            </div>
          )}
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
            <label>P1 Polymer</label>
            <select value={params.basePolymer} onChange={(e) => update('basePolymer', e.target.value as DesignParams['basePolymer'])}>
              <option value="Zeonex_150ppm">Zeonex 150ppm</option>
              <option value="PMMA">PMMA</option>
              <option value="Polycarbonate">Polycarbonate</option>
              <option value="Glass">Glass</option>
            </select>
          </div>
          <div className="field">
            <label>P3 Lattice</label>
            <select value={params.latticeGeometry} onChange={(e) => update('latticeGeometry', e.target.value as DesignParams['latticeGeometry'])}>
              <option value="Penrose_P3">Penrose P3</option>
              <option value="Hexagonal">Hexagonal</option>
              <option value="Square">Square</option>
              <option value="E8_Projection">E8 Projection</option>
            </select>
          </div>
          <div className="field">
            <label>P6 Dye</label>
            <select value={params.dyeDopant} onChange={(e) => update('dyeDopant', e.target.value as DesignParams['dyeDopant'])}>
              <option value="Lumogen_Red_305">Lumogen F Red 305</option>
              <option value="Lumogen_Yellow_083">Lumogen F Yellow 083</option>
              <option value="None">None</option>
            </select>
          </div>
          <div className="field">
            <label>P7 Dye ppm</label>
            <input type="number" min={10} max={500} value={params.dyeConcentrationPpm} onChange={(e) => update('dyeConcentrationPpm', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>P14 Edge PV</label>
            <select value={params.pvMaterial} onChange={(e) => update('pvMaterial', e.target.value as DesignParams['pvMaterial'])}>
              <option value="GaAs">GaAs</option>
              <option value="c-Si">c-Si</option>
              <option value="GaN">GaN</option>
              <option value="SiC">SiC</option>
              <option value="Perovskite">Perovskite</option>
            </select>
          </div>
          <div className="field">
            <label>P17 ṁ kg/s</label>
            <input type="number" min={0.01} max={0.5} step={0.01} value={params.massFlowKgS} onChange={(e) => update('massFlowKgS', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Cavity gas</label>
            <select value={params.cavityGas} onChange={(e) => update('cavityGas', e.target.value as DesignParams['cavityGas'])}>
              <option value="Argon">Argon</option>
              <option value="Krypton">Krypton</option>
              <option value="Air">Air</option>
            </select>
          </div>
          <div className="field">
            <label>Low-E ε</label>
            <input type="number" min={0.02} max={0.84} step={0.01} value={params.lowEEmissivity} onChange={(e) => update('lowEEmissivity', Number(e.target.value))} />
          </div>
          <div className="field">
            <label>P22 Thermal break mm</label>
            <input type="number" min={5} max={30} value={params.thermalBreakWidthMm} onChange={(e) => update('thermalBreakWidthMm', Number(e.target.value))} />
          </div>
        </aside>
        <main className="main">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          {tab === 'overview' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="Electrical η" value={m.electricalEfficiencyPct} unit="%" tone="ok" />
                <Metric label="Thermal η" value={m.thermalEfficiencyPct} unit="%" tone="ok" />
                <Metric label="Power density" value={m.powerDensityWm2} unit="W/m²" />
                <Metric label="U-factor" value={m.uFactor} unit="W/m²·K" tone={m.nfrc100Pass ? 'ok' : 'bad'} />
                <Metric label="SHGC" value={m.shgc} tone={m.nfrc200Pass ? 'ok' : 'warn'} />
                <Metric label="Cell temp" value={m.cellTempC} unit="°C" />
                <Metric label="Combined yield" value={m.combinedYieldWm2} unit="W/m²" />
                <Metric label="FRET" value={(m.fretEfficiency * 100).toFixed(1)} unit="%" />
              </div>
              <div className="card">
                <h3 className="section-title">Energy balance</h3>
                <div className="formula">{`α_sol · G = P_el + Q_th + Q_loss\nα=${m.alphaSol}  G=${Gsolar} W/m²  ṁ=${params.massFlowKgS} kg/s\nCavity=${params.cavityGas}  Low-E ε=${params.lowEEmissivity}  PV=${params.pvMaterial}\nTargets η_el=18.2% η_th=55.4%`}</div>
              </div>
            </div>
          )}
          {tab === 'optics' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="T_vis" value={m.opticalTransparency} />
                <Metric label="Haze" value={m.hazePct} unit="%" />
                <Metric label="Path F" value={m.pathLengthEnhancement} />
                <Metric label="FRET" value={(m.fretEfficiency * 100).toFixed(1)} unit="%" tone={m.fretEfficiency >= 0.95 ? 'ok' : 'warn'} />
                <Metric label="Trap" value={m.trapFraction} />
              </div>
            </div>
          )}
          {tab === 'thermal' && (
            <div className="grid-metrics">
              <Metric label="η_th" value={m.thermalEfficiencyPct} unit="%" />
              <Metric label="U" value={m.uFactor} unit="W/m²·K" tone={m.nfrc100Pass ? 'ok' : 'bad'} />
              <Metric label="ΔT fluid" value={m.fluidDeltaT} unit="K" />
              <Metric label="T_cell" value={m.cellTempC} unit="°C" />
            </div>
          )}
          {tab === 'structural' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="z_NA" value={m.neutralAxisMm} unit="mm" />
                <Metric label="σ_max" value={m.maxFlexuralStressMPa} unit="MPa" />
                <Metric label="WVTR" value={m.wvtr.toExponential(1)} />
                <Metric label="DP105" value={m.dp105Capable ? 'OK' : 'CHECK'} tone={m.dp105Capable ? 'ok' : 'warn'} />
              </div>
            </div>
          )}
          {tab === 'nocturnal' && (
            <div className="grid-metrics">
              <Metric label="Lunar" value={m.nocturnalLunarWm2} unit="W/m²" />
              <Metric label="TEG" value={m.nocturnalTEGWm2} unit="W/m²" />
              <Metric label="ΔT" value={m.nocturnalDeltaT} unit="K" />
            </div>
          )}
          {tab === 'electrical' && (
            <div className="grid-metrics">
              <Metric label="η_el" value={m.electricalEfficiencyPct} unit="%" />
              <Metric label="Power" value={m.powerDensityWm2} unit="W/m²" />
              <Metric label="Inverter" value={params.inverterTopology.replace(/_/g, ' ')} />
              <Metric label="PV" value={params.pvMaterial} />
            </div>
          )}
          {tab === 'compliance' && (
            <div className="card">
              <h3 className="section-title">Compliance matrix</h3>
              <div className="param-list">
                <div><span>NFRC 100 U≤0.85</span><span className={m.nfrc100Pass ? 'pass' : 'fail'}>{m.uFactor} {m.nfrc100Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>NFRC 200 SHGC 0.20–0.40</span><span className={m.nfrc200Pass ? 'pass' : 'fail'}>{m.shgc} {m.nfrc200Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>ASTM E1300 DP105</span><span className={m.dp105Capable ? 'pass' : 'fail'}>{m.dp105Capable ? 'PASS' : 'REVIEW'}</span></div>
                <div><span>NEC 690</span><span className={m.nec690Pass ? 'pass' : 'fail'}>{m.nec690Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>UL 61730</span><span className={m.ul61730Pass ? 'pass' : 'fail'}>{m.ul61730Pass ? 'PASS' : 'FAIL'}</span></div>
                <div><span>IEEE 1547</span><span className={m.ieee1547Pass ? 'pass' : 'fail'}>{m.ieee1547Pass ? 'PASS' : 'FAIL'}</span></div>
              </div>
              <div className="btn-row"><button className="btn" type="button" onClick={runAutoSolve}>⚡ Auto-Solve & Fix All Errors</button></div>
            </div>
          )}
          {tab === 'parameters' && (
            <div className="card">
              <h3 className="section-title">22-parameter vector</h3>
              <div className="param-list">{labels.map((row) => (
                <div key={row.key}><span>{row.key}</span><span>{row.value}</span></div>
              ))}</div>
            </div>
          )}
          {tab === 'qubo' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="H_total" value={H.toFixed(4)} />
                <Metric label="FNO" value="<50" unit="ms" tone="ok" />
                <Metric label="QAOA p" value={3} />
                <Metric label="Qubits" value={105} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
