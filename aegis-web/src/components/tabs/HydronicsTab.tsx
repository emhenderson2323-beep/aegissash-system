export function ElectricalTab() {
  return (
    <div className="tab-grid two-col">
      <div className="card panel">
        <h3>I–V / P–V curves</h3>
        <svg viewBox="0 0 240 160" className="curve-svg">
          <path d="M10 130 Q 70 90 140 60 T 230 20" fill="none" stroke="#60a5fa" strokeWidth="3" />
          <path d="M10 120 Q 60 50 140 40 T 230 70" fill="none" stroke="#34d399" strokeWidth="3" />
        </svg>
      </div>

      <div className="card panel">
        <h3>Loss summary</h3>
        <table className="table-mini">
          <tbody>
            <tr><td>Conductor</td><td>1.7%</td></tr>
            <tr><td>Contact</td><td>0.9%</td></tr>
            <tr><td>MPPT</td><td>97.8%</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
