import { useMemo, useState } from 'react';
import {
  NetMeteringInputs,
  DEFAULT_NET_METERING_INPUTS,
  YearFinancialSummary,
} from '../types/netMetering';
import { calculateNetMeteringROI } from '../netMeteringEngine';

export interface GridExportCalculatorProps {
  defaultElectricalKwh: number;
  defaultThermalKwh: number;
  defaultCapEx: number;
}

export function GridExportCalculator({
  defaultElectricalKwh,
  defaultThermalKwh,
  defaultCapEx,
}: GridExportCalculatorProps) {
  const [inputs, setInputs] = useState<NetMeteringInputs>({
    ...DEFAULT_NET_METERING_INPUTS,
    annualElectricalGenkWh: defaultElectricalKwh,
    annualThermalGenkWh: defaultThermalKwh,
    systemCapEx: defaultCapEx,
  });
  const [showTable, setShowTable] = useState(true);

  const set = <K extends keyof NetMeteringInputs>(key: K, value: NetMeteringInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const syncFromSim = () => {
    setInputs((prev) => ({
      ...prev,
      annualElectricalGenkWh: defaultElectricalKwh,
      annualThermalGenkWh: defaultThermalKwh,
      systemCapEx: defaultCapEx,
    }));
  };

  const results = useMemo(() => calculateNetMeteringROI(inputs), [inputs]);

  const maxCum = Math.max(
    1,
    ...results.annualBreakdown.map((r: YearFinancialSummary) => Math.abs(r.cumulativeCashFlow)),
  );
  const maxAnnual = Math.max(
    1,
    ...results.annualBreakdown.map((r: YearFinancialSummary) => r.grossAnnualSavings),
  );

  const money = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const money2 = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  return (
    <div className="stack">
      <div className="card">
        <h3 className="section-title">Utility &amp; rate structure (Maine / NE baseline)</h3>
        <div className="two-col">
          <div className="field">
            <label>All-in retail rate: ${inputs.allInRetailRate.toFixed(2)}/kWh</label>
            <input
              type="range"
              min={0.1}
              max={0.6}
              step={0.01}
              value={inputs.allInRetailRate}
              onChange={(e) => set('allInRetailRate', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Export compensation model</label>
            <select
              value={inputs.exportCompensationType}
              onChange={(e) =>
                set(
                  'exportCompensationType',
                  e.target.value as NetMeteringInputs['exportCompensationType'],
                )
              }
            >
              <option value="retail_1to1">1:1 Retail Net Energy Billing (NEB)</option>
              <option value="wholesale_avoided">Wholesale / Avoided Cost</option>
              <option value="tou_split">Time-of-Use (TOU) blended credit</option>
            </select>
          </div>
          {inputs.exportCompensationType === 'wholesale_avoided' && (
            <div className="field">
              <label>Wholesale export rate: ${inputs.wholesaleExportRate.toFixed(2)}/kWh</label>
              <input
                type="range"
                min={0.02}
                max={0.2}
                step={0.01}
                value={inputs.wholesaleExportRate}
                onChange={(e) => set('wholesaleExportRate', Number(e.target.value))}
              />
            </div>
          )}
          <div className="field">
            <label>Annual rate escalation: {inputs.annualRateEscalation.toFixed(1)}%/yr</label>
            <input
              type="range"
              min={0}
              max={8}
              step={0.1}
              value={inputs.annualRateEscalation}
              onChange={(e) => set('annualRateEscalation', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Self-consumption ratio: {inputs.selfConsumptionRatio}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={inputs.selfConsumptionRatio}
              onChange={(e) => set('selfConsumptionRatio', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Thermal offset value: ${inputs.thermalOffsetValuePerkWh.toFixed(2)}/kWh</label>
            <input
              type="range"
              min={0.04}
              max={0.3}
              step={0.01}
              value={inputs.thermalOffsetValuePerkWh}
              onChange={(e) => set('thermalOffsetValuePerkWh', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">System cost, incentives &amp; yield</h3>
        <div className="two-col">
          <div className="field">
            <label>Installed CapEx ($)</label>
            <input
              type="number"
              min={0}
              step={50}
              value={inputs.systemCapEx}
              onChange={(e) => set('systemCapEx', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Incentive / ITC deduction ($)</label>
            <input
              type="number"
              min={0}
              step={50}
              value={inputs.incentiveDeduction}
              onChange={(e) => set('incentiveDeduction', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Annual electrical generation (kWh)</label>
            <input
              type="number"
              min={0}
              step={10}
              value={inputs.annualElectricalGenkWh}
              onChange={(e) => set('annualElectricalGenkWh', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Annual thermal generation (kWh-eq)</label>
            <input
              type="number"
              min={0}
              step={10}
              value={inputs.annualThermalGenkWh}
              onChange={(e) => set('annualThermalGenkWh', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Degradation: {inputs.annualDegradationRate}%/yr</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={inputs.annualDegradationRate}
              onChange={(e) => set('annualDegradationRate', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Discount rate (NPV): {inputs.discountRate}%</label>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={inputs.discountRate}
              onChange={(e) => set('discountRate', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn secondary" type="button" onClick={syncFromSim}>
            Sync yields &amp; CapEx from current Aegis simulation
          </button>
        </div>
      </div>

      <div className="grid-metrics">
        <div className="metric">
          <div className="label">Year-1 bill reduction</div>
          <div className="value" style={{ color: 'var(--good)' }}>
            {money(results.year1Savings)}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
            Self {money2(results.year1SelfConsumptionValue)} · Export{' '}
            {money2(results.year1GridExportValue)} · Thermal{' '}
            {money2(results.year1ThermalOffsetValue)}
          </div>
        </div>
        <div className="metric">
          <div className="label">Simple payback</div>
          <div className="value">{results.simplePaybackYears}</div>
          <div className="unit">years</div>
        </div>
        <div className="metric">
          <div className="label">Discounted payback</div>
          <div className="value">{results.discountedPaybackYears}</div>
          <div className="unit">years</div>
        </div>
        <div className="metric">
          <div className="label">25-yr net savings</div>
          <div className="value" style={{ color: 'var(--good)' }}>
            {money(results.twentyFiveYearNetSavings)}
          </div>
        </div>
        <div className="metric">
          <div className="label">NPV @ {inputs.discountRate}%</div>
          <div
            className="value"
            style={{ color: results.npv >= 0 ? 'var(--good)' : 'var(--bad)' }}
          >
            {money(results.npv)}
          </div>
        </div>
        <div className="metric">
          <div className="label">LCOE</div>
          <div className="value">${results.lcoePerkWh.toFixed(3)}</div>
          <div className="unit">/kWh</div>
        </div>
        <div className="metric">
          <div className="label">25-yr ROI</div>
          <div className="value">{results.twentyFiveYearRoiPercent}%</div>
        </div>
        <div className="metric">
          <div className="label">Net CapEx</div>
          <div className="value">
            {money(Math.max(0, inputs.systemCapEx - inputs.incentiveDeduction))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">25-year cumulative cash flow</h3>
        <div className="nm-chart">
          <svg viewBox="0 0 500 160" className="nm-svg" preserveAspectRatio="none">
            <line x1="0" y1="80" x2="500" y2="80" stroke="#243049" strokeWidth="1" />
            {results.annualBreakdown.map((row: YearFinancialSummary, i: number) => {
              const x = (i / Math.max(1, results.annualBreakdown.length - 1)) * 490 + 5;
              const y = 80 - (row.cumulativeCashFlow / maxCum) * 70;
              const yAnn = 150 - (row.grossAnnualSavings / maxAnnual) * 40;
              const prev = results.annualBreakdown[i - 1];
              const x0 =
                i === 0
                  ? x
                  : ((i - 1) / Math.max(1, results.annualBreakdown.length - 1)) * 490 + 5;
              const y0 =
                i === 0
                  ? 80 - (-Math.max(0, inputs.systemCapEx - inputs.incentiveDeduction) / maxCum) * 70
                  : 80 - (prev.cumulativeCashFlow / maxCum) * 70;
              return (
                <g key={row.year}>
                  <rect x={x - 3} y={yAnn} width={6} height={150 - yAnn} fill="#6366f133" />
                  {i > 0 && (
                    <line x1={x0} y1={y0} x2={x} y2={y} stroke="#22d3ee" strokeWidth="1.5" />
                  )}
                  <circle cx={x} cy={y} r={2} fill="#22d3ee" />
                </g>
              );
            })}
          </svg>
          <div className="nm-chart-legend">
            <span style={{ color: '#22d3ee' }}>—— Cumulative cash flow</span>
            <span style={{ color: '#6366f1' }}>▮ Annual savings</span>
            <span style={{ color: 'var(--muted)' }}>Zero = payback</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            Year-by-year cash flow
          </h3>
          <button className="btn secondary" type="button" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Collapse' : 'Expand'} table
          </button>
        </div>
        {showTable && (
          <div className="bom-table-wrap" style={{ maxHeight: 360 }}>
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Prod. kWh</th>
                  <th>Self-cons $</th>
                  <th>Export $</th>
                  <th>Thermal $</th>
                  <th>Gross $</th>
                  <th>Cumulative $</th>
                </tr>
              </thead>
              <tbody>
                {results.annualBreakdown.map((row: YearFinancialSummary) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{row.grossGenerationkWh.toFixed(0)}</td>
                    <td>{money2(row.selfConsumptionSavings)}</td>
                    <td>{money2(row.gridExportCredits)}</td>
                    <td>{money2(row.thermalSavings)}</td>
                    <td>{money2(row.grossAnnualSavings)}</td>
                    <td
                      style={{
                        color: row.cumulativeCashFlow >= 0 ? 'var(--good)' : 'var(--bad)',
                      }}
                    >
                      {money2(row.cumulativeCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
