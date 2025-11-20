import { useState } from 'react';

export default function GridLayoutControls({ onLayoutChange }) {
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState(16);
  const [minWidth, setMinWidth] = useState(400);

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
      padding: '12px',
      background: 'var(--bg-secondary, #2d2d2d)',
      borderRadius: '8px',
      border: '1px solid var(--border-color, #4a9eff)',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '12px',
          minWidth: '70px'
        }}>
          Columns: {columns}
        </label>
        <input
          type="range"
          min="1"
          max="4"
          value={columns}
          onChange={(e) => handleColumnChange(e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '12px',
          minWidth: '70px'
        }}>
          Gap: {gap}px
        </label>
        <input
          type="range"
          min="8"
          max="32"
          value={gap}
          onChange={(e) => handleGapChange(e.target.value)}
          style={{ width: '100px' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ 
          color: 'var(--text-primary, #ffffff)', 
          fontSize: '12px',
          minWidth: '70px'
        }}>
          Min Width: {minWidth}px
        </label>
        <input
          type="range"
          min="300"
          max="600"
          step="50"
          value={minWidth}
          onChange={(e) => handleMinWidthChange(e.target.value)}
          style={{ width: '100px' }}
        />
      </div>
    </div>
  );
}
