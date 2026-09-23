export function ElectricalSLDCanvas() {
  return (
    <div className="sld-wrap">
      <svg viewBox="0 0 480 240" role="img" aria-label="Single-line diagram">
        <rect x="20" y="30" width="110" height="150" rx="12" fill="#0f172a" stroke="#7dd3fc" />
        <text x="75" y="60" fill="#e2e8f0" textAnchor="middle">PV Strings</text>
        {Array.from({ length: 5 }).map((_, index) => (
          <line
            key={index}
            x1={40 + index * 18}
            y1={90}
            x2={40 + index * 18}
            y2={160}
            stroke="#34d399"
            strokeWidth="3"
          />
        ))}

        <line x1="130" y1="104" x2="200" y2="104" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="200" y="70" width="90" height="70" rx="12" fill="#1e293b" stroke="#fbbf24" />
        <text x="245" y="108" fill="#f8fafc" textAnchor="middle">DC/DC</text>

        <line x1="290" y1="104" x2="330" y2="104" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="330" y="70" width="110" height="70" rx="12" fill="#1e293b" stroke="#60a5fa" />
        <text x="385" y="108" fill="#f8fafc" textAnchor="middle">Microinverter</text>

        <line x1="385" y1="140" x2="385" y2="190" stroke="#cbd5e1" strokeWidth="3" />
        <line x1="220" y1="190" x2="385" y2="190" stroke="#cbd5e1" strokeWidth="3" />
        <circle cx="220" cy="190" r="8" fill="#f97316" />
        <text x="220" y="220" fill="#f8fafc" textAnchor="middle">Grid</text>
      </svg>
    </div>
  );
}
