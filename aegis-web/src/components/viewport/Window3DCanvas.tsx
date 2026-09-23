type Props = {
  showFrame: boolean;
  showCells: boolean;
  showRays: boolean;
  onToggleFrame: () => void;
  onToggleCells: () => void;
  onToggleRays: () => void;
};

export function ViewportControls({
  showFrame,
  showCells,
  showRays,
  onToggleFrame,
  onToggleCells,
  onToggleRays,
}: Props) {
  return (
    <div className="viewport-controls">
      <label>
        <input checked={showFrame} onChange={onToggleFrame} type="checkbox" />
        Frame
      </label>
      <label>
        <input checked={showCells} onChange={onToggleCells} type="checkbox" />
        PV cells
      </label>
      <label>
        <input checked={showRays} onChange={onToggleRays} type="checkbox" />
        Ray paths
      </label>
    </div>
  );
}
