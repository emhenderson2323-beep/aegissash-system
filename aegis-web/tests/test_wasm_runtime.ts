export function AuditDagTab() {
  const nodes = [
    { id: 'a1', label: 'optics.trap_fraction' },
    { id: 'a2', label: 'thermal.u_factor' },
    { id: 'a3', label: 'electrical.r_conductor' },
    { id: 'a4', label: 'finance.npv' },
  ];

  const downloadPackage = () => {
    const payload = JSON.stringify({ nodes, schema_version: '1.0', timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'audit-package.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card panel section-space">
      <div className="split-head">
        <h3>Calculation DAG</h3>
        <button className="primary-button" onClick={downloadPackage} type="button">Download JSON</button>
      </div>
      <ul className="dag-tree">
        {nodes.map((node) => (
          <li key={node.id}>{node.id}: {node.label}</li>
        ))}
      </ul>
    </div>
  );
}
