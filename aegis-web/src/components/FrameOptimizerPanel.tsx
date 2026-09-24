import { useMemo, useState } from 'react';
import {
  optimizeFrameMaterial,
  FRAME_MATERIAL_LIBRARY,
  FrameOptimizeResult,
  FrameOptimizeTargets,
} from '../lib/frameOptimizer';

export interface FrameOptimizerPanelProps {
  targetCostPerSqFt: number;
  targetUFactor: number;
  targetDpRating: number;
  panelWidthM: number;
  panelHeightM: number;
  glassStackCostUsd: number;
  onSelectMaterial?: (materialId: string | null) => void;
}

export function FrameOptimizerPanel({
  targetCostPerSqFt,
  targetUFactor,
  targetDpRating,
  panelWidthM,
  panelHeightM,
  glassStackCostUsd,
  onSelectMaterial,
}: FrameOptimizerPanelProps) {
  const [autoSelect, setAutoSelect] = useState(true);
  const [manualId, setManualId] = useState<string | null>(null);

  const result: FrameOptimizeResult = useMemo(() => {
    const targets: FrameOptimizeTargets = {
      targetCostPerSqFt,
      targetUFactor,
      targetDpRating,
      climateDeltaT: 50,
      panelWidthM,
      panelHeightM,
      areaSqFt: Math.max(1, panelWidthM * panelHeightM * 10.764),
      glassStackCostUsd,
      forcedMaterialId: autoSelect ? null : manualId,
    };
    return optimizeFrameMaterial(targets);
  }, [
    targetCostPerSqFt,
    targetUFactor,
    targetDpRating,
    panelWidthM,
    panelHeightM,
    glassStackCostUsd,
    autoSelect,
    manualId,
  ]);

  const pickManual = (id: string) => {
    setAutoSelect(false);
    setManualId(id);
    onSelectMaterial?.(id);
  };

  const enableAuto = () => {
    setAutoSelect(true);
    setManualId(null);
    onSelectMaterial?.(null);
  };

  return (
    <div className="stack">
      <div className="card">
        <h3 className="section-title">Frame Optimizer — unconstrained material search</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 0 }}>
          Evaluates fiberglass, thermally broken aluminum, PVC-CF, WPC, cellular PVC, stainless,
          and a generative synthetic blend. No material is forced — ranking balances cost, U-factor,
          CTE match to glass, and DP capacity.
        </p>
        <div className="btn-row" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${autoSelect ? 'quantum' : 'secondary'}`}
            onClick={enableAuto}
          >
            🤖 Generative Auto-Select (Lowest Cost &amp; Best Quality)
          </button>
          <label className="toggle-row" style={{ marginTop: 0 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
              Mode: {result.mode === 'auto' ? 'Auto' : 'Manual override'}
            </span>
          </label>
        </div>
        <div className="grid-metrics" style={{ marginTop: '0.75rem' }}>
          <div className="metric">
            <div className="label">Selected frame</div>
            <div className="value" style={{ fontSize: '0.85rem', color: 'var(--cyan)' }}>
              {result.selected.material.name}
            </div>
          </div>
          <div className="metric">
            <div className="label">$/linear ft</div>
            <div className="value">${result.selected.material.costPerLinearFt}</div>
          </div>
          <div className="metric">
            <div className="label">System U (est.)</div>
            <div className="value">{result.selected.estimatedSystemU}</div>
          </div>
          <div className="metric">
            <div className="label">DP rating</div>
            <div className="value">DP{result.selected.dpRating}</div>
          </div>
          <div className="metric">
            <div className="label">CTE match</div>
            <div className="value">{(result.selected.cteMatchScore * 100).toFixed(0)}%</div>
          </div>
          <div className="metric">
            <div className="label">Overall score</div>
            <div className="value" style={{ color: 'var(--good)' }}>
              {result.selected.overallScore}
            </div>
          </div>
        </div>
        <div className="formula" style={{ marginTop: '0.5rem' }}>
          {result.selected.rationale}
          {'\n'}
          Frame cost ${result.selected.frameCostUsd} · total ≈ ${result.selected.totalCostPerSqFt}/ft² · τ≈
          {result.selected.tauMaxKPa} kPa
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Live comparison matrix (all candidates)</h3>
        <div className="bom-table-wrap" style={{ maxHeight: 320 }}>
          <table className="bom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th>$/ft</th>
                <th>k</th>
                <th>CTE match</th>
                <th>DP</th>
                <th>U est.</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result.ranking.map((row) => (
                <tr
                  key={row.material.id}
                  style={{
                    background: row.selected ? '#1e3a5f55' : undefined,
                  }}
                >
                  <td>{row.rank}</td>
                  <td>
                    {row.material.name}
                    {row.material.category === 'generative' ? ' ⚡' : ''}
                  </td>
                  <td>${row.material.costPerLinearFt}</td>
                  <td>{row.material.kWmK}</td>
                  <td>{(row.cteMatchScore * 100).toFixed(0)}%</td>
                  <td>DP{row.dpRating}</td>
                  <td>{row.estimatedSystemU}</td>
                  <td style={{ color: row.selected ? 'var(--good)' : undefined }}>
                    {row.overallScore}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                      onClick={() => pickManual(row.material.id)}
                    >
                      Use
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
          Library size: {FRAME_MATERIAL_LIBRARY.length} standards + generative blend. Click Use to
          override auto-select.
        </div>
      </div>
    </div>
  );
}
