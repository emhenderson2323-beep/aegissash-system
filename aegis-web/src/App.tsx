import { useCallback, useMemo, useState } from 'react';
import {
  DesignParams,
  computePhysics,
  paramsToLabels,
  evaluateHamiltonian,
  buildLaminateStack,
  computeNeutralAxis,
  simulateAnnualYield,
  simulateDegradation25y,
  PRESET_LOCATIONS,
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
  inverseDesignSolve,
  InverseTargetSpecs,
  InverseDesignResult,
} from './utils/solver';
import {
  PROTOTYPE,
  buildBom,
  glassStackLayers,
  ELECTRICAL_SPEC,
  ASSEMBLY_STEPS,
  DynamicStackResult,
  buildCsiSubmittal,
} from './lib/manufacturing';
import { GridExportCalculator } from './components/GridExportCalculator';

type TabId =
  | 'overview' | 'optics' | 'thermal' | 'structural' | 'nocturnal'
  | 'electrical' | 'compliance' | 'parameters' | 'qubo'
  | 'bom' | 'stack' | 'wiring' | 'assembly' | 'forecast' | 'net-metering';

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
  { id: 'forecast', label: '25-Year Climate & ROI' },
  { id: 'net-metering', label: 'Net Metering & Grid Export' },
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
  const [invCost, setInvCost] = useState(100);
  const [invPower, setInvPower] = useState(70);
  const [invU, setInvU] = useState(0.7);
  const [invDp, setInvDp] = useState(105);
  const [inverseResult, setInverseResult] = useState<InverseDesignResult | null>(null);
  const [locationIdx, setLocationIdx] = useState(0);
  const [tiltDeg, setTiltDeg] = useState(30);
  const [bomCostOverride, setBomCostOverride] = useState(1593);

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
  const location = PRESET_LOCATIONS[locationIdx] ?? PRESET_LOCATIONS[0];
  const yieldForecast = useMemo(
    () =>
      simulateAnnualYield(
        location,
        tiltDeg,
        m.electricalEfficiencyPct,
        m.thermalEfficiencyPct,
        PROTOTYPE.areaM2,
        bomCostOverride,
      ),
    [location, tiltDeg, m.electricalEfficiencyPct, m.thermalEfficiencyPct, bomCostOverride],
  );
  const degradation = useMemo(
    () =>
      simulateDegradation25y(
        params.dyeConcentrationPpm,
        params.barrierType !== 'None',
        params.thermalBreakWidthMm,
      ),
    [params.dyeConcentrationPpm, params.barrierType, params.thermalBreakWidthMm],
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
        setBomCostOverride(cands[0].result.bomCostUsd);
      }
    }, 30);
  };

  const applyCandidate = (c: ParetoCandidate) => {
    setSelectedStack(c.result);
    setParams(stackConfigToParams(c.result.config, params));
    setBomCostOverride(c.result.bomCostUsd);
  };

  const runInverseDesign = () => {
    const targets: InverseTargetSpecs = {
      targetCostPerSqFt: invCost,
      targetPowerWm2: invPower,
      targetUFactor: invU,
      targetDpRating: invDp,
    };
    const result = inverseDesignSolve(targets, params, 5000);
    setInverseResult(result);
    setParams(result.params);
    setSelectedStack(result.stack);
    setBomCostOverride(result.stack.bomCostUsd);
  };

  const downloadCsiSubmittal = () => {
    const csi = buildCsiSubmittal({
      uFactor: m.uFactor,
      shgc: m.shgc,
      dpCapable: m.dp105Capable,
      nec690: m.nec690Pass,
      bomTotalUsd: bom.totalUsd,
      netPowerWm2: m.netPowerDensityWm2,
      tauMaxKPa: m.tauMaxKPa,
      cteOk: !m.cteDelaminationRisk,
    });
    const lines = [
      csi.projectTitle,
      '='.repeat(72),
      '',
      csi.sectionGlazing,
      csi.sectionCurtainWall,
      '',
      'PRODUCT: ' + csi.productName,
      csi.description,
      '',
      '1. STRUCTURAL / WIND LOAD',
      ...csi.structural.map((s) => '  • ' + s),
      '',
      '2. THERMAL & OPTICAL (NFRC)',
      ...csi.thermalOptical.map((s) => '  • ' + s),
      '',
      '3. ELECTRICAL (NEC 690 / IP67)',
      ...csi.electrical.map((s) => '  • ' + s),
      '',
      '4. WARRANTY & BOM STATEMENT',
      ...csi.warranty.map((s) => '  • ' + s),
      '',
      csi.bomSummary,
      '',
      'Generated by Aegis Sash Super-Intelligence Simulator',
      'Docket AEGIS-PROV-2026-01 — CSI MasterFormat Division 08',
      new Date().toISOString(),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AegisSash_CSI_Division08_Submittal.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>AegisSash Super-Intelligence Simulator</h1>
          <span>Net Metering · Grid Export ROI · NEB · v87</span>
        </div>
        <div className="badge-row">
          <span className={`badge ${m.nfrc100Pass ? 'ok' : 'fail'}`}>NFRC 100 {m.nfrc100Pass ? 'PASS' : 'FAIL'}</span>
          <span className={`badge ${m.nfrc200Pass ? 'ok' : 'fail'}`}>NFRC 200 {m.nfrc200Pass ? 'PASS' : 'FAIL'}</span>
          <span className={`badge ${m.dp105Capable ? 'ok' : 'fail'}`}>DP105 {m.dp105Capable ? 'OK' : 'CHECK'}</span>
          <span className={`badge ${!m.cteDelaminationRisk ? 'ok' : 'fail'}`}>CTE {m.cteDelaminationRisk ? 'RISK' : 'OK'}</span>
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
              <span>Auto-Correct Mode</span>
            </label>
          </div>

          <h3 className="section-title">Quantum-inspired optimization</h3>
          <div className="field">
            <label>Strategy</label>
            <select value={optMode} onChange={(e) => setOptMode(e.target.value as OptimizeMode)}>
              <option value="pareto_roi">Pareto Optimal</option>
              <option value="max_performance">Maximum Performance</option>
              <option value="budget_cap">Target Budget Cap</option>
              <option value="exhaustive">Exhaustive Quantum Sweep</option>
            </select>
          </div>
          {optMode === 'budget_cap' && (
            <div className="field">
              <label>Budget cap (USD)</label>
              <input type="number" min={400} max={5000} step={50} value={budgetCap} onChange={(e) => setBudgetCap(Number(e.target.value))} />
            </div>
          )}
          <div className="btn-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn quantum" type="button" onClick={runQuantumOpt} disabled={!!sweepProgress?.running}>
              ⚛️ Run Quantum Optimization
            </button>
            <button className="btn secondary" type="button" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? 'Hide' : 'Show'} candidates ({candidates.length})
            </button>
          </div>

          <h3 className="section-title">🤖 AI Inverse Generative Optimizer</h3>
          <div className="field">
            <label>Target cost ($/sq ft): {invCost}</label>
            <input type="range" min={40} max={200} step={5} value={invCost} onChange={(e) => setInvCost(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Target power (W/m²): {invPower}</label>
            <input type="range" min={20} max={120} step={5} value={invPower} onChange={(e) => setInvPower(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Target U-factor: {invU}</label>
            <input type="range" min={0.4} max={1.4} step={0.05} value={invU} onChange={(e) => setInvU(Number(e.target.value))} />
          </div>
          <button className="btn quantum" type="button" onClick={runInverseDesign}>
            🤖 Run Inverse Design Solve
          </button>

          <h3 className="section-title">Operating conditions</h3>
          <div className="field">
            <label>Solar irradiance G (W/m²)</label>
            <input type="number" min={0} max={1200} value={Gsolar} onChange={(e) => setGsolar(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Ambient temperature (°C)</label>
            <input type="number" min={-20} max={50} value={Tamb} onChange={(e) => setTamb(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>P14 Edge PV</label>
            <select value={params.pvMaterial} onChange={(e) => update('pvMaterial', e.target.value as DesignParams['pvMaterial'])}>
              <option value="GaAs">GaAs</option>
              <option value="c-Si">c-Si</option>
              <option value="GaN">GaN</option>
            </select>
          </div>
          <div className="field">
            <label>Cavity gas</label>
            <select value={params.cavityGas} onChange={(e) => update('cavityGas', e.target.value as DesignParams['cavityGas'])}>
              <option value="Argon">Argon</option>
              <option value="Krypton">Krypton</option>
              <option value="Air">Air</option>
            </select>
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
                <Metric label="Gross power" value={m.powerDensityWm2} unit="W/m²" />
                <Metric label="Net power (−pump)" value={m.netPowerDensityWm2} unit="W/m²" tone="ok" />
                <Metric label="U-factor" value={m.uFactor} unit="W/m²·K" tone={m.nfrc100Pass ? 'ok' : 'bad'} />
                <Metric label="SHGC" value={m.shgc} />
              </div>
              <div className="card">
                <h3 className="section-title">📄 CSI MasterFormat Architectural Submittal</h3>
                <button className="btn" type="button" onClick={downloadCsiSubmittal}>
                  📄 Download Architectural Submittal (CSI Division 08)
                </button>
              </div>
            </div>
          )}
          {tab === 'optics' && (
            <div className="grid-metrics">
              <Metric label="T_vis" value={m.opticalTransparency} />
              <Metric label="FRET" value={(m.fretEfficiency * 100).toFixed(1)} unit="%" />
            </div>
          )}
          {tab === 'thermal' && (
            <div className="grid-metrics">
              <Metric label="η_th" value={m.thermalEfficiencyPct} unit="%" />
              <Metric label="U" value={m.uFactor} unit="W/m²·K" />
              <Metric label="P_pump" value={m.pumpPowerW} unit="W" />
              <Metric label="Net power" value={m.netPowerDensityWm2} unit="W/m²" tone="ok" />
              <Metric label="CTE τ_max" value={m.tauMaxKPa} unit="kPa" tone={m.cteDelaminationRisk ? 'bad' : 'ok'} />
            </div>
          )}
          {tab === 'structural' && (
            <div className="grid-metrics">
              <Metric label="z_NA" value={m.neutralAxisMm} unit="mm" />
              <Metric label="DP105" value={m.dp105Capable ? 'OK' : 'CHECK'} />
            </div>
          )}
          {tab === 'nocturnal' && (
            <div className="grid-metrics">
              <Metric label="TEG" value={m.nocturnalTEGWm2} unit="W/m²" />
            </div>
          )}
          {tab === 'electrical' && (
            <div className="grid-metrics">
              <Metric label="η_el" value={m.electricalEfficiencyPct} unit="%" />
              <Metric label="Net power" value={m.netPowerDensityWm2} unit="W/m²" tone="ok" />
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
            </div>
          )}
          {tab === 'bom' && (
            <div className="card">
              <h3 className="section-title">Physical BOM — {PROTOTYPE.label}</h3>
              <div className="grid-metrics">
                <Metric label="Total BOM" value={`$${bom.totalUsd}`} tone="ok" />
              </div>
              <div className="bom-table-wrap">
                <table className="bom-table">
                  <thead><tr><th>Category</th><th>Component</th><th>Ext. $</th></tr></thead>
                  <tbody>
                    {bom.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.category}</td>
                        <td>{line.component}</td>
                        <td>${line.extendedUsd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'stack' && (
            <div className="stack-diagram">
              {stack.layers.map((L) => (
                <div key={L.index} className="stack-layer">
                  <span className="stack-idx">L{L.index}</span>
                  <span className="stack-name">{L.name}</span>
                  <span className="stack-th">{L.thicknessMm < 0.01 ? '35 nm' : `${L.thicknessMm} mm`}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'wiring' && (
            <div className="card">
              <div className="param-list">
                <div><span>Frame</span><span>{ELECTRICAL_SPEC.dualCavityFrame}</span></div>
                <div><span>IP rating</span><span>{ELECTRICAL_SPEC.ipRating}</span></div>
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
                </div>
              ))}
            </div>
          )}
          {tab === 'forecast' && (
            <div className="grid-metrics">
              <Metric label="Y1 electric" value={yieldForecast.year1ElectricKwh} unit="kWh" tone="ok" />
              <Metric label="Y1 savings" value={`$${yieldForecast.year1SavingsUsd}`} tone="ok" />
              <Metric label="Payback" value={yieldForecast.paybackYears} unit="yr" />
              <Metric label="Y25 ROI" value={yieldForecast.roi25Pct} unit="%" />
            </div>
          )}
          {tab === 'net-metering' && (
            <GridExportCalculator
              defaultElectricalKwh={yieldForecast.year1ElectricKwh}
              defaultThermalKwh={yieldForecast.year1ThermalBtu / 3412.14}
              defaultCapEx={bomCostOverride}
            />
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
                  <span>F(x) {c.roiScore}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
