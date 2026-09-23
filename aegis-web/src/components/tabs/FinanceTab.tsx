export function HydronicsTab() {
  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>Hydronic heat recovery</h3>
        <div className="metric-list">
          <div className="metric-row">
            <span>Flow rate</span>
            <strong>0.22 kg/s</strong>
          </div>
          <div className="metric-row">
            <span>Delta-T</span>
            <strong>7.2°C</strong>
          </div>
          <div className="metric-row">
            <span>Q thermal</span>
            <strong>6.5 kW</strong>
          </div>
        </div>
      </div>

      <div className="card panel">
        <h3>Pump parasitics</h3>
        <div className="gauge small">
          <div className="gauge-fill" style={{ width: '42%' }} />
          <span>0.51 kW</span>
        </div>
      </div>
    </div>
  );
}
