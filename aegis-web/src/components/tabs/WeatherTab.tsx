export function OpticsTab() {
  const metrics = [
    { label: 'Theoretical trap fraction', value: '0.68', unit: 'fraction', tone: 'blue' },
    { label: 'Measured LSC efficiency', value: '0.52', unit: 'fraction', tone: 'green' },
    { label: 'Critical angle', value: '42.1', unit: 'deg', tone: 'amber' },
  ];

  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>Optical evidence</h3>
        <div className="metric-list">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric-row">
              <span>{metric.label}</span>
              <strong className={metric.tone}>{metric.value}</strong>
              <small>{metric.unit}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="card panel">
        <h3>Layer stack</h3>
        <div className="stack-chart">
          <div className="bar blue" style={{ width: '62%' }}>
            Glass + coating
          </div>
          <div className="bar green" style={{ width: '54%' }}>
            PV conversion
          </div>
          <div className="bar amber" style={{ width: '36%' }}>
            TIR losses
          </div>
        </div>
      </div>
    </div>
  );
}
