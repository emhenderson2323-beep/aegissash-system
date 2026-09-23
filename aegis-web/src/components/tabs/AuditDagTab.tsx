export function ComplianceTab() {
  const evidence = [
    'NFRC 100/200: Window thermal and solar heat gain evidence complete',
    'UL 1703: PV module fire and safety compliance package complete',
    'ASTM E330 / ASTM E1300: Structural screening only; physical chamber testing required',
  ];

  return (
    <div className="card panel section-space">
      <h3>Compliance evidence matrix</h3>
      <div className="warning-banner">
        PRELIMINARY ANALYTICAL SCREENING ONLY. Does not replace physical chamber testing under ASTM E330 / ASTM E1300.
      </div>
      <ul className="checklist">
        {evidence.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
