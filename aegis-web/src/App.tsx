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
  runQuantumParetoSweep,
  stackConfigToParams,
  OptimizeMode,
  SweepProgress,
  ParetoCandidate,
} from './utils/solver';
import {
  PROTOTYPE,
  buildBom,
  glassStackLayers,
  ELECTRICAL_SPEC,
  ASSEMBLY_STEPS,
  DynamicStackResult,
} from './lib/manufacturing';

type TabId =
  | 'overview' | 'optics' | 'thermal' | 'structural' | 'nocturnal'
  | 'electrical' | 'compliance' | 'parameters' | 'qubo'
  | 'bom' | 'stack' | 'wiring' | 'assembly';

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
  { id: 'bom', label: 'Physical BOM' },
  { id: 'stack', label: 'Glass Stack & Layup' },
  { id: 'wiring', label: 'Electrical & Wiring' },
  { id: 'assembly', label: 'Assembly Manual' },
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
  const [optMode, setOptMode] = useState<OptimizeMode>('pareto_roi');
  const [budgetCap, setBudgetCap] = useState(1200);
  const [sweepProgress, setSweepProgress] = useState<SweepProgress | null>(null);
  const [candidates, setCandidates] = useState<ParetoCandidate[]>([]);
  const [selectedStack, setSelectedStack] = useState<DynamicStackResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const m = useMemo(() => computePhysics(params, Gsolar, Tamb), [params, Gsolar, Tamb]);
  const labels = useMemo(() => paramsToLabels(params), [params]);
  const H = useMemo(() => evaluateHamiltonian(m), [m]);
  const laminate = useMemo(() => {
    const layers = buildLaminateStack(params);
    return { layers, ...computeNeutralAxis(layers) };
  }, [params]);
  const bom = useMemo(() => buildBom(), []);
  const stack = useMemo(
    () => glassStackLayers(params.substrateThicknessMm),
    [params.substrateThicknessMm],
  );

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

  const runQuantumOpt = () => {
    setDrawerOpen(true);
    const target = optMode === 'exhaustive' ? 8000 : optMode === 'max_performance' ? 5000 : 4000;
    setSweepProgress({
      stateCount: 0, evaluated: 0, target, energy: 0, temperature: 2.5,
      bestFitness: 0, running: true, message: 'Initializing 105-qubit emulator…',
    });
    window.setTimeout(() => {
      const { candidates: cands, evaluated, elapsedMs } = runQuantumParetoSweep({
        mode: optMode,
        budgetCapUsd: budgetCap,
        targetStates: target,
        onProgress: (prog) => setSweepProgress({ ...prog }),
      });
      setCandidates(cands);
      setSweepProgress((prev) =>
        prev
          ? { ...prev, running: false, evaluated, message: `Done in ${elapsedMs} ms · ${cands.length} candidates · ${evaluated} states` }
          : null,
      );
      if (cands.length > 0) {
        setSelectedStack(cands[0].result);
        setParams(stackConfigToParams(cands[0].result.config, params));
      }
    }, 30);
  };

  const applyCandidate = (c: ParetoCandidate) => {
    setSelectedStack(c.result);
    setParams(stackConfigToParams(c.result.config, params));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>AegisSash Executive Portal</h1>
          <span>Docket AEGIS-PROV-2026-01 · QUBO/QAOA Pareto Sweep · v84.1</span>
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
            <button className="btn" type="button" onClick={runAutoSolve}>⚡ Auto-Solve &amp; Fix All Errors</button>
            <label className="toggle-row">
              <input type="checkbox" checked={autoCorrectMode} onChange={(e) => {
                const on = e.target.checked;
                setAutoCorrectMode(on);
                if (on) setParams(clampToCompliantBand(params));
              }} />
              <span>Auto-Correct Mode</span>
            </label>
          </div>
          {lastCorrections.length > 0 && (
            <div className="correction-log">
              <div className="label">Last solver actions ({lastCorrections.length})</div>
              <ul>{lastCorrections.slice(0, 6).map((c, i) => (
                <li key={`${c.field}-${i}`}><strong>{c.field}</strong>: {String(c.from)} → {String(c.to)}</li>
              ))}</ul>
            </div>
          )}

          <h3 className="section-title">Quantum-inspired optimization</h3>
          <div className="field">
            <label>Strategy</label>
            <select value={optMode} onChange={(e) => setOptMode(e.target.value as OptimizeMode)}>
              <option value="pareto_roi">Pareto Optimal (Best Value / Max ROI)</option>
              <option value="max_performance">Maximum Performance (No Budget Cap)</option>
              <option value="budget_cap">Target Budget Cap</option>
              <option value="exhaustive">Exhaustive Quantum Sweep</option>
            </select>
          </div>
          {optMode === 'budget_cap' && (
            <div className="field">
              <label>Budget cap (USD / window)</label>
              <input type="number" min={400} max={5000} step={50} value={budgetCap} onChange={(e) => setBudgetCap(Number(e.target.value))} />
            </div>
          )}
          <div className="btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn quantum" type="button" onClick={runQuantumOpt} disabled={!!sweepProgress?.running}>
              ⚛️ Run Quantum-Inspired Optimization (105-Qubit Emulator)
            </button>
            <button className="btn secondary" type="button" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? 'Hide' : 'Show'} top candidates ({candidates.length})
            </button>
          </div>
          {sweepProgress && (
            <div className="quantum-status">
              <div className="label">{sweepProgress.message}</div>
              <div className="q-metrics">
                <span>E(q)={sweepProgress.energy}</span>
                <span>T={sweepProgress.temperature}</span>
                <span>{sweepProgress.evaluated}/{sweepProgress.target}</span>
              </div>
              <div className="q-bar">
                <div className="q-bar-fill" style={{ width: `${Math.min(100, (100 * sweepProgress.evaluated) / Math.max(1, sweepProgress.target))}%` }} />
              </div>
            </div>
          )}
          {selectedStack && (
            <div className="correction-log">
              <div className="label">Active candidate</div>
              <div style={{ color: 'var(--cyan)', fontSize: '0.72rem' }}>
                {selectedStack.label} · BOM ${selectedStack.bomCostUsd} · U={selectedStack.uFactor} · F={selectedStack.fitness}
              </div>
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
            <label>P14 Edge PV</label>
            <select value={params.pvMaterial} onChange={(e) => update('pvMaterial', e.target.value as DesignParams['pvMaterial'])}>
              <option value="GaAs">GaAs</option>
              <option value="c-Si">c-Si</option>
              <option value="GaN">GaN</option>
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
                <Metric label="Combined yield" value={m.combinedYieldWm2} unit="W/m²" />
              </div>
            </div>
          )}
          {tab === 'optics' && (
            <div className="grid-metrics">
              <Metric label="T_vis" value={m.opticalTransparency} />
              <Metric label="Haze" value={m.hazePct} unit="%" />
              <Metric label="FRET" value={(m.fretEfficiency * 100).toFixed(1)} unit="%" />
              <Metric label="Trap" value={m.trapFraction} />
            </div>
          )}
          {tab === 'thermal' && (
            <div className="grid-metrics">
              <Metric label="η_th" value={m.thermalEfficiencyPct} unit="%" />
              <Metric label="U" value={m.uFactor} unit="W/m²·K" tone={m.nfrc100Pass ? 'ok' : 'bad'} />
              <Metric label="ΔT fluid" value={m.fluidDeltaT} unit="K" />
            </div>
          )}
          {tab === 'structural' && (
            <div className="grid-metrics">
              <Metric label="z_NA" value={m.neutralAxisMm} unit="mm" />
              <Metric label="σ_max" value={m.maxFlexuralStressMPa} unit="MPa" />
              <Metric label="DP105" value={m.dp105Capable ? 'OK' : 'CHECK'} tone={m.dp105Capable ? 'ok' : 'warn'} />
            </div>
          )}
          {tab === 'nocturnal' && (
            <div className="grid-metrics">
              <Metric label="Lunar" value={m.nocturnalLunarWm2} unit="W/m²" />
              <Metric label="TEG" value={m.nocturnalTEGWm2} unit="W/m²" />
            </div>
          )}
          {tab === 'electrical' && (
            <div className="grid-metrics">
              <Metric label="η_el" value={m.electricalEfficiencyPct} unit="%" />
              <Metric label="Power" value={m.powerDensityWm2} unit="W/m²" />
              <Metric label="PV" value={params.pvMaterial} />
            </div>
          )}
          {tab === 'compliance' && (
            <div className="card">
              <div className="param-list">
                <div><span>NFRC 100</span><span className={m.nfrc100Pass ? 'pass' : 'fail'}>{m.uFactor}</span></div>
                <div><span>NFRC 200</span><span className={m.nfrc200Pass ? 'pass' : 'fail'}>{m.shgc}</span></div>
                <div><span>DP105</span><span className={m.dp105Capable ? 'pass' : 'fail'}>{m.dp105Capable ? 'PASS' : 'REVIEW'}</span></div>
              </div>
            </div>
          )}
          {tab === 'parameters' && (
            <div className="card">
              <div className="param-list">{labels.map((row) => (
                <div key={row.key}><span>{row.key}</span><span>{row.value}</span></div>
              ))}</div>
            </div>
          )}
          {tab === 'qubo' && (
            <div className="grid-metrics">
              <Metric label="H_total" value={H.toFixed(4)} />
              <Metric label="QAOA p" value={3} />
              <Metric label="Qubits" value={105} />
            </div>
          )}
          {tab === 'bom' && (
            <div className="card">
              <h3 className="section-title">Physical BOM — {PROTOTYPE.label}</h3>
              <div className="grid-metrics">
                <Metric label="Total BOM" value={`$${bom.totalUsd}`} tone="ok" />
                <Metric label="Cost / sq ft" value={`$${bom.costPerSqFt}`} />
              </div>
              <div className="bom-table-wrap">
                <table className="bom-table">
                  <thead><tr><th>Category</th><th>Component</th><th>Spec</th><th>Ext. $</th><th>Supplier</th></tr></thead>
                  <tbody>
                    {bom.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.category}</td>
                        <td><strong>{line.component}</strong><br /><span className="muted">{line.tradeName}</span></td>
                        <td>{line.specification}</td>
                        <td>${line.extendedUsd}</td>
                        <td>{line.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'stack' && (
            <div className="stack">
              <div className="grid-metrics">
                <Metric label="Total thickness" value={stack.totalMm} unit="mm" />
                <Metric label="z_NA" value={stack.zNA_mm} unit="mm" />
                <Metric label="Weight" value={stack.weightLbPerSqFt} unit="lb/ft²" />
              </div>
              <div className="stack-diagram">
                {stack.layers.map((L) => (
                  <div key={L.index} className="stack-layer" style={{ minHeight: Math.max(18, Math.min(56, L.thicknessMm * 10 + 12)) }}>
                    <span className="stack-idx">L{L.index}</span>
                    <span className="stack-name">{L.name}</span>
                    <span className="stack-th">{L.thicknessMm < 0.01 ? '35 nm' : `${L.thicknessMm} mm`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'wiring' && (
            <div className="card">
              <div className="param-list">
                <div><span>Primary DC bus</span><span>{ELECTRICAL_SPEC.primaryBus}</span></div>
                <div><span>Form factor</span><span>{ELECTRICAL_SPEC.inverterFormFactor}</span></div>
                <div><span>NEC 690</span><span>{ELECTRICAL_SPEC.rapidShutdown}</span></div>
              </div>
            </div>
          )}
          {tab === 'assembly' && (
            <div className="stack">
              {ASSEMBLY_STEPS.map((s) => (
                <div className="card" key={s.step}>
                  <h3 className="section-title">Step {s.step}: {s.title}</h3>
                  <ol className="build-steps">{s.details.map((d, i) => <li key={i}>{d}</li>)}</ol>
                  <div className="check-list"><strong>Checks</strong><ul>{s.checks.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {drawerOpen && candidates.length > 0 && (
        <aside className="candidates-drawer">
          <div className="drawer-head">
            <h3>Pareto candidates</h3>
            <button type="button" className="btn secondary" onClick={() => setDrawerOpen(false)}>Close</button>
          </div>
          <div className="cand-list">
            {candidates.map((c) => (
              <button
                key={c.rank}
                type="button"
                className={`cand-card ${selectedStack?.label === c.result.label ? 'active' : ''}`}
                onClick={() => applyCandidate(c)}
              >
                <div className="cand-rank">#{c.rank} · {c.result.label}</div>
                <div className="cand-grid">
                  <span>BOM ${c.result.bomCostUsd}</span>
                  <span>U {c.result.uFactor}</span>
                  <span>P {c.result.powerWm2} W/m²</span>
                  <span>η_el {c.result.etaEl}%</span>
                  <span>Layers {c.result.config.layerCount}</span>
                  <span>Payback {c.paybackYears} yr</span>
                  <span>F(x) {c.roiScore}</span>
                  <span>{c.result.dp105Pass ? 'DP105 OK' : 'DP105?'}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
