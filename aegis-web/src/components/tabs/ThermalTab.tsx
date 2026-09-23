export function WeatherTab() {
  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>Solar geometry</h3>
        <div className="controls-row">
          <label>Zenith 48°</label>
          <input defaultValue={48} max={90} min={0} type="range" />
        </div>
        <div className="controls-row">
          <label>Azimuth 165°</label>
          <input defaultValue={165} max={360} min={0} type="range" />
        </div>
        <div className="controls-row">
          <label>Ambient 24°C</label>
          <input defaultValue={24} max={40} min={-10} type="range" />
        </div>
      </div>

      <div className="card panel">
        <h3>Plane-of-array irradiance</h3>
        <div className="line-plot">
          <div className="line-point" style={{ left: '10%', top: '56%' }} />
          <div className="line-point" style={{ left: '24%', top: '42%' }} />
          <div className="line-point" style={{ left: '48%', top: '30%' }} />
          <div className="line-point" style={{ left: '72%', top: '36%' }} />
          <div className="line-point" style={{ left: '88%', top: '60%' }} />
        </div>
      </div>
    </div>
  );
}
