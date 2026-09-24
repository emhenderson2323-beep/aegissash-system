import { useMemo, useState } from 'react';
import {
  runMonteCarloStressTest,
  StressTestInputs,
  StressTestResult,
} from '../lib/stressEngine';

export interface StressTestPanelProps {
  inputs: StressTestInputs;
}

function Gauge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color =
    value < 20 ? 'var(--good)' : value < 45 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>
        {value.toFixed(0)}
        <span className="unit">%</span>
      </div>
      <div
        style={{
          marginTop: '0.4rem',
          height: 8,
          background: 'var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, value)}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

export function StressTestPanel({ inputs }: StressTestPanelProps) {
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [running, setRunning] = useState(false);

  const baselineNote = useMemo(
    () =>
      `U=${inputs.baseUFactor} · τ=${inputs.baseTauMaxKPa} kPa · Y1 ${inputs.year1ElectricKwh} kWh · CapEx $${inputs.systemCapEx}`,
    [inputs],
  );

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      const r = runMonteCarloStressTest(inputs, 1000);
      setResult(r);
      setRunning(false);
    }, 30);
  };

  return (
    <div className="stack">
      <div className="card">
        <h3 className="section-title">🛡️ Fault-Tolerance &amp; Risk Audit</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 0 }}>
          Monte Carlo topological sensitivity: freeze-thaw (−40°F…120°F), DP30–DP105 wind,
          pump flow loss 0–100%, utility rate volatility, and material scatter. Reports P50 / P90 /
          P99 on 25-year ROI and seal integrity.
        </p>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          Baseline: {baselineNote}
        </div>
        <button className="btn quantum" type="button" disabled={running} onClick={run}>
          {running ? 'Running 1,000-point sweep…' : 'Run 1,000-Point Edge-Case Validation'}
        </button>
      </div>

      {result && (
        <>
          <div className="grid-metrics">
            <Gauge label="Interfacial shear failure risk" value={result.gauges.interfacialShear} />
            <Gauge label="Thermal shock deflection risk" value={result.gauges.thermalShock} />
            <Gauge label="25-yr payback variance (CV)" value={result.gauges.paybackVariance} />
            <div className="metric">
              <div className="label">Structural pass rate</div>
              <div
                className="value"
                style={{
                  color: result.structuralPassRatePct >= 85 ? 'var(--good)' : 'var(--warn)',
                }}
              >
                {result.structuralPassRatePct}%
              </div>
            </div>
            <div className="metric">
              <div className="label">Financial pass (payback &lt; 15 yr)</div>
              <div
                className="value"
                style={{
                  color: result.financialPassRatePct >= 70 ? 'var(--good)' : 'var(--warn)',
                }}
              >
                {result.financialPassRatePct}%
              </div>
            </div>
            <div className="metric">
              <div className="label">Runtime</div>
              <div className="value">
                {result.elapsedMs}
                <span className="unit">ms · {result.iterations} iters</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Payback years (confidence intervals)</h3>
            <div className="grid-metrics">
              <div className="metric">
                <div className="label">P50</div>
                <div className="value">{result.paybackYears.p50}</div>
                <div className="unit">years</div>
              </div>
              <div className="metric">
                <div className="label">P90</div>
                <div className="value">{result.paybackYears.p90}</div>
              </div>
              <div className="metric">
                <div className="label">P99</div>
                <div className="value">{result.paybackYears.p99}</div>
              </div>
              <div className="metric">
                <div className="label">Mean</div>
                <div className="value">{result.paybackYears.mean}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">25-year cumulative net savings ($)</h3>
            <div className="grid-metrics">
              <div className="metric">
                <div className="label">P50</div>
                <div className="value">${result.cumulative25ySavings.p50.toLocaleString()}</div>
              </div>
              <div className="metric">
                <div className="label">P90</div>
                <div className="value">${result.cumulative25ySavings.p90.toLocaleString()}</div>
              </div>
              <div className="metric">
                <div className="label">P99</div>
                <div className="value">${result.cumulative25ySavings.p99.toLocaleString()}</div>
              </div>
              <div className="metric">
                <div className="label">Mean</div>
                <div className="value">${result.cumulative25ySavings.mean.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Structural seal integrity (0–100)</h3>
            <div className="grid-metrics">
              <div className="metric">
                <div className="label">P50</div>
                <div className="value">{result.sealIntegrityScore.p50}</div>
              </div>
              <div className="metric">
                <div className="label">P90</div>
                <div className="value">{result.sealIntegrityScore.p90}</div>
              </div>
              <div className="metric">
                <div className="label">Min (worst)</div>
                <div
                  className="value"
                  style={{
                    color: result.sealIntegrityScore.min < 50 ? 'var(--bad)' : 'var(--good)',
                  }}
                >
                  {result.sealIntegrityScore.min}
                </div>
              </div>
            </div>
            <div className="formula" style={{ marginTop: '0.75rem' }}>
              {result.worstCaseSummary}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
