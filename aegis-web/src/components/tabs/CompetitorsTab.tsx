export function FinanceTab() {
  const bars = [68, 80, 94, 118, 132, 156];

  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>25-year pro forma</h3>
        <div className="bar-chart">
          {bars.map((value, index) => (
            <div key={value + index} className="bar-stack">
              <span style={{ height: `${value}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card panel">
        <h3>Economics</h3>
        <div className="metric-list">
          <div className="metric-row"><span>NPV</span><strong>$264k</strong></div>
          <div className="metric-row"><span>IRR</span><strong>14.7%</strong></div>
          <div className="metric-row"><span>LCOE</span><strong>0.082 $/kWh</strong></div>
          <div className="metric-row"><span>Payback</span><strong>8.6 years</strong></div>
        </div>
      </div>
    </div>
  );
}
