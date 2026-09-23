export function InverseDesignTab() {
  return (
    <div className="card panel section-space">
      <h3>Inverse design targets</h3>
      <div className="controls-row">
        <label>Target U-factor 0.80 W/m²K</label>
        <input defaultValue={0.8} max={1.4} min={0.4} step={0.05} type="range" />
      </div>
      <div className="controls-row">
        <label>Target power 420 W</label>
        <input defaultValue={420} max={800} min={200} step={10} type="range" />
      </div>
      <button className="primary-button" type="button">Run optimizer</button>
    </div>
  );
}
