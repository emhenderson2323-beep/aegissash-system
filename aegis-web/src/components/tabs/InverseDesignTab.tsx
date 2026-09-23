export function CompetitorsTab() {
  const rows = [
    { name: 'U-factor', value: '0.80', status: '0.95' },
    { name: 'Power density', value: '124 W/m²', status: 'N/A' },
    { name: 'Thermal recovery', value: '6.5 kW', status: 'N/A' },
  ];

  return (
    <div className="card panel section-space">
      <h3>Competitive benchmark</h3>
      <table className="table-mini wide">
        <thead>
          <tr>
            <th>Metric</th>
            <th>AegisSash</th>
            <th>Conventional</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.value}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
