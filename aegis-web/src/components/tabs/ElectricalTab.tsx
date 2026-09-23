export function ThermalTab() {
  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>U-factor breakdown</h3>
        <div className="stack-chart">
          <div className="bar blue" style={{ width: '72%' }}>Center pane 1.8 W/m²K</div>
          <div className="bar orange" style={{ width: '46%' }}>Frame 2.4 W/m²K</div>
        </div>
      </div>

      <div className="card panel">
        <h3>Cell operating temperature</h3>
        <div className="gauge">
          <div className="gauge-fill" style={{ width: '78%' }} />
          <span>39.8°C</span>
        </div>
      </div>
    </div>
  );
}
