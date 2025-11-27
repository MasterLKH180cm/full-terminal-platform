import { useState } from 'react';

export default function GridLayoutControls({ onLayoutChange }) {
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState(16);
  const [minWidth, setMinWidth] = useState(300);

  const handleColumnChange = (value) => {
    const cols = parseInt(value);
    setColumns(cols);
    if (onLayoutChange) {
      onLayoutChange({ columns: cols, gap, minWidth });
    }
  };

  const handleGapChange = (value) => {
    const g = parseInt(value);
    setGap(g);
    if (onLayoutChange) {
      onLayoutChange({ columns, gap: g, minWidth });
    }
  };

  const handleMinWidthChange = (value) => {
    const mw = parseInt(value);
    setMinWidth(mw);
    if (onLayoutChange) {
      onLayoutChange({ columns, gap, minWidth: mw });
    }
  };

  return (
    <div style={{
      padding: '8px',
      background: 'var(--bg-secondary, #2d2d2d)',
      borderRadius: '6px',
      border: '1px solid var(--border-color, #4a9eff)',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '11px',
          minWidth: '65px'
        }}>
          Columns: {columns}
        </label>
        <input
          type="range"
          min="1"
          max="4"
          value={columns}
          onChange={(e) => handleColumnChange(e.target.value)}
          style={{ width: '90px' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '11px',
          minWidth: '65px'
        }}>
          Gap: {gap}px
        </label>
        <input
          type="range"
          min="8"
          max="32"
          value={gap}
          onChange={(e) => handleGapChange(e.target.value)}
          style={{ width: '90px' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '11px',
          minWidth: '65px'
        }}>
          Min Width: {minWidth}px
        </label>
        <input
          type="range"
          min="100"
          max="500"
          step="50"
          value={minWidth}
          onChange={(e) => handleMinWidthChange(e.target.value)}
          style={{ width: '90px' }}
        />
      </div>
    </div>
  );
}
